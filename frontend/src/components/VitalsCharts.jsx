import React, { useEffect, useRef, useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip,
  ReferenceLine, ReferenceArea, AreaChart, Area,
  ComposedChart, Cell
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

const useChartSize = (minHeight = 300) => {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: minHeight });

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const measure = () => {
      const width = Math.max(0, Math.floor(node.clientWidth || 0));
      const height = Math.max(minHeight, Math.floor(node.clientHeight || minHeight));
      setSize({ width, height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [minHeight]);

  return { ref, width: size.width, height: size.height };
};

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
        <p className="text-[10px] text-gray-600 dark:text-gray-300 font-black uppercase tracking-widest mb-1">{new Date(label).toLocaleDateString()}</p>
        <div className="space-y-1">
          {payload.map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{p.name}:</span>
              <span className={`text-sm font-black ${p.color ? '' : 'text-emerald-500'}`} style={{ color: p.color }}>
                {p.value} <span className="text-[10px] text-gray-600 dark:text-gray-300">{unit}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const BloodPressureChart = ({ data }) => {
  const { theme } = useTheme();
  const { ref, width, height } = useChartSize(300);
  return (
    <div ref={ref} className="h-[300px] w-full min-w-0">
      {width > 0 ? (
        <LineChart width={width} height={height} data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1f2937' : '#f3f4f6'} vertical={false} />
          <XAxis dataKey="chartIndex" hide />
          <YAxis
            domain={['auto', 'auto']}
            stroke={theme === 'dark' ? '#4b5563' : '#9ca3af'}
            fontSize={10}
            tickFormatter={(val) => Math.round(Number(val))}
          />
          <Tooltip content={<CustomTooltip unit="mmHg" />} />
          <ReferenceArea y1={60} y2={80} fill="#10b981" fillOpacity={0.05} />
          <Line
            type="monotone" 
            name="Systolic"
            dataKey="systolic"
            stroke="#ef4444" 
            strokeWidth={3}
            isAnimationActive={false}
            dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: theme === 'dark' ? '#111827' : '#fff' }}
            activeDot={{ r: 6 }}
            connectNulls
          />
          <Line
            type="monotone" 
            name="Diastolic"
            dataKey="diastolic"
            stroke="#3b82f6" 
            strokeWidth={3}
            isAnimationActive={false}
            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: theme === 'dark' ? '#111827' : '#fff' }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        </LineChart>
      ) : null}
    </div>
  );
};

export const GlucoseChart = ({ data, hba1c }) => {
  const { theme } = useTheme();
  const { ref, width, height } = useChartSize(300);
  return (
    <div ref={ref} className="h-[300px] w-full min-w-0 relative">
      {width > 0 ? (
        <AreaChart width={width} height={height} data={data}>
          <defs>
            <linearGradient id="colorGlucose" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1f2937' : '#f3f4f6'} vertical={false} />
          <XAxis dataKey="chartIndex" hide />
          <YAxis stroke="#4b5563" fontSize={10} />
          <Tooltip content={<CustomTooltip unit="mg/dL" />} />
          <ReferenceLine y={100} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'right', value: 'Normal', fill: '#10b981', fontSize: 10 }} />
          <Area
            type="monotone" 
            name="Glucose"
            dataKey="numericValue"
            stroke="#f59e0b" 
            fillOpacity={1} 
            fill="url(#colorGlucose)" 
            strokeWidth={3}
            isAnimationActive={false}
            connectNulls
          />
        </AreaChart>
      ) : null}
    </div>
  );
};

export const WeightBMIChart = ({ data }) => {
  const { theme } = useTheme();
  const { ref, width, height } = useChartSize(300);
  return (
    <div ref={ref} className="h-[300px] w-full min-w-0">
      {width > 0 ? (
        <ComposedChart width={width} height={height} data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1f2937' : '#f3f4f6'} vertical={false} />
          <XAxis dataKey="chartIndex" hide />
          <YAxis yAxisId="left" stroke="#4b5563" fontSize={10} />
          <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={10} />
          <Tooltip content={<CustomTooltip unit="kg / bmi" />} />
          <Bar yAxisId="left" dataKey="numericValue" name="Weight" fill="#3b82f6" opacity={0.3} radius={[10, 10, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="bmi" name="BMI" stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive={false} connectNulls />
        </ComposedChart>
      ) : null}
    </div>
  );
};

export const StepsChart = ({ data }) => {
  const { theme } = useTheme();
  const { ref, width, height } = useChartSize(300);
  return (
    <div ref={ref} className="h-[300px] w-full min-w-0">
      {width > 0 ? (
        <BarChart width={width} height={height} data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1f2937' : '#f3f4f6'} vertical={false} />
          <XAxis dataKey="chartIndex" hide />
          <YAxis stroke="#4b5563" fontSize={10} />
          <Tooltip content={<CustomTooltip unit="steps" />} />
          <ReferenceLine y={8000} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'GOAL', fill: '#10b981', fontSize: 10 }} />
          <Bar
            dataKey="numericValue"
            name="Steps"
            radius={[10, 10, 0, 0]}
            fill="#10b981"
          >
            {(data || []).map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={Number(entry?.value) >= 8000 ? '#10b981' : '#3b82f6'}
                opacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      ) : null}
    </div>
  );
};

export const SleepPatternChart = ({ data }) => {
  const { theme } = useTheme();
  const { ref, width, height } = useChartSize(300);
  return (
    <div ref={ref} className="h-[300px] w-full min-w-0">
      {width > 0 ? (
        <ComposedChart width={width} height={height} data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1f2937' : '#f3f4f6'} vertical={false} />
          <XAxis dataKey="chartIndex" hide />
          <YAxis stroke="#4b5563" fontSize={10} />
          <Tooltip content={<CustomTooltip unit="hours" />} />
          <Bar dataKey="numericValue" name="Duration" fill="#8884d8" opacity={0.3} radius={[10, 10, 0, 0]} />
          <Line type="monotone" dataKey="quality" name="Quality" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} isAnimationActive={false} connectNulls />
        </ComposedChart>
      ) : null}
    </div>
  );
};
