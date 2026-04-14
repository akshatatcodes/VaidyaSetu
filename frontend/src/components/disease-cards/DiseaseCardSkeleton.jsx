import React from 'react';
import { motion } from 'framer-motion';

const DiseaseCardSkeleton = () => {
  return (
    <div className="w-full space-y-6 pt-6 animate-pulse">
      {/* Interpretation Summary Skeleton */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-emerald-500/10 rounded-full w-1/4" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-full" />
          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-5/6" />
          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-4/6" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
          <div className="h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full" />
          <div className="h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full" />
          <div className="h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="grid grid-cols-3 gap-4 p-4 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
            <div className="h-2 bg-gray-100 dark:bg-gray-800/60 rounded-full" />
            <div className="h-2 bg-gray-100 dark:bg-gray-800/40 rounded-full" />
            <div className="h-2 bg-gray-100 dark:bg-gray-800/40 rounded-full" />
          </div>
        ))}
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex justify-between items-center pt-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-32" />
        <div className="flex gap-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full w-16" />
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default DiseaseCardSkeleton;
