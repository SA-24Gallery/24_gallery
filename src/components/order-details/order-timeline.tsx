"use client";

import React from "react";

interface TimelineStep {
    title: string;
    date: string;
    time: string;
    completed: boolean;
}

interface OrderTimelineProps {
    steps: TimelineStep[];
}

const formatDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // เดือนต้อง +1 เพราะเริ่มที่ 0
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

  
const OrderTimeline: React.FC<OrderTimelineProps> = ({ steps }) => {
  return (
    <div className="flex items-center justify-between w-full my-4">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full ${
                step.completed ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              {step.completed && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <div className="text-center mt-2">
              <p className="text-sm font-medium">{step.title}</p>
              {step.date && step.time && (
                <p className="text-xs text-gray-500">
                  {step.date} {step.time}
                </p>
              )}
            </div>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`h-1 ${
                steps[index + 1].completed ? "bg-green-500" : "bg-gray-300"
              }`}
              style={{
                width: '10vw',
                height: '2px',
                margin: '0 8px',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default OrderTimeline;
