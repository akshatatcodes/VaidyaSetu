"""
Predictive Risk Accuracy Pipeline (improved)

What this script does:
1) Fetches a public labeled diabetes dataset (Pima Indians).
2) Computes rule-based baseline score aligned with current diabetes logic.
3) Adds feature engineering.
4) Trains stronger ML models (including XGBoost if installed).
5) Reports metrics with threshold optimization for both F1 and Accuracy.

Usage:
  python src/tests/predictive_accuracy_pipeline.py
"""

from __future__ import annotations

import io
import json
import urllib.request
from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

try:
    from xgboost import XGBClassifier
except Exception:
    XGBClassifier = None


DATA_URL = "https://raw.githubusercontent.com/jbrownlee/Datasets/master/pima-indians-diabetes.data.csv"


@dataclass
class Metrics:
    roc_auc: float
    accuracy: float
    precision: float
    recall: float
    f1: float
    brier_score: float
    threshold: float


def fetch_dataset() -> pd.DataFrame:
    cols = [
        "pregnancies",
        "glucose",
        "blood_pressure",
        "skin_thickness",
        "insulin",
        "bmi",
        "dpf",
        "age",
        "outcome",
    ]
    raw = urllib.request.urlopen(DATA_URL, timeout=30).read().decode("utf-8")
    df = pd.read_csv(io.StringIO(raw), header=None, names=cols)
    # Replace known "invalid zero" values with median imputations.
    # (Pregnancies and outcome can legitimately be zero.)
    for c in ["glucose", "blood_pressure", "skin_thickness", "insulin", "bmi"]:
        df[c] = df[c].replace(0, np.nan)
        df[c] = df[c].fillna(df[c].median())
    return df


def diabetes_rule_score(row: pd.Series) -> float:
    # A compact approximation of current deterministic diabetes-style scoring.
    age = int(row["age"])
    bmi = float(row["bmi"])
    dpf = float(row["dpf"])

    waist = 90 if bmi >= 30 else (84 if bmi >= 25 else 78)
    family = "Both" if dpf >= 1.2 else ("One" if dpf >= 0.6 else "None")
    activity = "Occasional"

    score = 0
    score += 0 if age < 35 else (20 if age < 50 else 30)
    score += 0 if waist < 80 else (10 if waist < 90 else 20)
    score += 0 if activity in ("Regular", "active") else (10 if activity in ("Occasional", "moderate") else 20)
    score += 20 if family == "Both" else (10 if family == "One" else 0)

    return round(min(95, max(2, score)))


def evaluate(y_true: np.ndarray, probs: np.ndarray, threshold: float) -> Metrics:
    preds = (probs >= threshold).astype(int)
    return Metrics(
        roc_auc=float(roc_auc_score(y_true, probs)),
        accuracy=float(accuracy_score(y_true, preds)),
        precision=float(precision_score(y_true, preds, zero_division=0)),
        recall=float(recall_score(y_true, preds, zero_division=0)),
        f1=float(f1_score(y_true, preds, zero_division=0)),
        brier_score=float(brier_score_loss(y_true, probs)),
        threshold=float(threshold),
    )


def best_threshold_for_f1(y_true: np.ndarray, probs: np.ndarray) -> float:
    best_t = 0.5
    best_f1 = -1.0
    for t in np.arange(0.2, 0.81, 0.01):
        f1 = f1_score(y_true, (probs >= t).astype(int), zero_division=0)
        if f1 > best_f1:
            best_f1 = f1
            best_t = float(t)
    return best_t


def best_threshold_for_accuracy(y_true: np.ndarray, probs: np.ndarray) -> float:
    best_t = 0.5
    best_acc = -1.0
    for t in np.arange(0.2, 0.81, 0.01):
        acc = accuracy_score(y_true, (probs >= t).astype(int))
        if acc > best_acc:
            best_acc = acc
            best_t = float(t)
    return best_t


def normalize_probs(raw: np.ndarray) -> np.ndarray:
    if raw.min() < 0 or raw.max() > 1:
        return (raw - raw.min()) / (raw.max() - raw.min() + 1e-9)
    return raw


def build_feature_frame(df: pd.DataFrame) -> pd.DataFrame:
    x = df.copy()
    # Lightweight engineered interactions
    x["glucose_bmi"] = x["glucose"] * x["bmi"]
    x["age_bmi"] = x["age"] * x["bmi"]
    x["bp_age"] = x["blood_pressure"] * x["age"]
    x["insulin_glucose_ratio"] = x["insulin"] / (x["glucose"] + 1e-6)
    x["metabolic_load"] = (
        0.35 * x["glucose"] + 0.25 * x["bmi"] + 0.20 * x["dpf"] * 100 + 0.20 * x["age"]
    )
    return x


def main() -> None:
    df = fetch_dataset()
    y = df["outcome"].astype(int).values

    # Baseline rule score evaluation
    baseline_scores = df.apply(diabetes_rule_score, axis=1).values.astype(float)
    baseline_probs = baseline_scores / 100.0
    baseline_threshold = 0.40  # aligns with 40% risk cutoff
    baseline_metrics = evaluate(y, baseline_probs, baseline_threshold)

    # ML feature matrix
    base_feature_cols = [
        "pregnancies",
        "glucose",
        "blood_pressure",
        "skin_thickness",
        "insulin",
        "bmi",
        "dpf",
        "age",
    ]
    feat_df = build_feature_frame(df)
    feature_cols = base_feature_cols + [
        "glucose_bmi",
        "age_bmi",
        "bp_age",
        "insulin_glucose_ratio",
        "metabolic_load",
    ]
    X = feat_df[feature_cols].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    models = {
        "logistic_regression": Pipeline(
            [
                ("scaler", StandardScaler()),
                ("clf", LogisticRegression(max_iter=1200, class_weight="balanced")),
            ]
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=500, random_state=42, class_weight="balanced"
        ),
        "hist_gradient_boosting": HistGradientBoostingClassifier(
            max_iter=500, learning_rate=0.03, max_depth=4, random_state=42
        ),
    }
    if XGBClassifier is not None:
        models["xgboost"] = XGBClassifier(
            n_estimators=600,
            learning_rate=0.03,
            max_depth=4,
            subsample=0.9,
            colsample_bytree=0.9,
            reg_lambda=1.0,
            objective="binary:logistic",
            eval_metric="auc",
            random_state=42,
        )

    results = {
        "dataset": "Pima Indians Diabetes (public labeled benchmark)",
        "n_rows": int(len(df)),
        "positive_rate": float(y.mean()),
        "baseline_rule_engine": baseline_metrics.__dict__,
        "models": {},
    }

    for name, model in models.items():
        model.fit(X_train, y_train)

        train_raw = model.predict_proba(X_train)[:, 1] if hasattr(model, "predict_proba") else model.decision_function(X_train)
        train_probs = normalize_probs(train_raw)
        best_t_f1 = best_threshold_for_f1(y_train, train_probs)
        best_t_acc = best_threshold_for_accuracy(y_train, train_probs)

        test_raw = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else model.decision_function(X_test)
        test_probs = normalize_probs(test_raw)

        metrics_f1 = evaluate(y_test, test_probs, best_t_f1)
        metrics_acc = evaluate(y_test, test_probs, best_t_acc)

        # 5-fold CV AUC on full dataset for stability signal
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_raw = cross_val_predict(model, X, y, cv=cv, method="predict_proba")[:, 1] if hasattr(model, "predict_proba") else cross_val_predict(model, X, y, cv=cv, method="decision_function")
        cv_probs = normalize_probs(cv_raw)
        cv_auc = float(roc_auc_score(y, cv_probs))

        results["models"][name] = {
            "cv_auc_5fold": cv_auc,
            "optimized_for_f1": metrics_f1.__dict__,
            "optimized_for_accuracy": metrics_acc.__dict__,
        }

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()

