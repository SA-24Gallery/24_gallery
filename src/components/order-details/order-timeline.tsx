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

const OrderTimeline: React.FC<OrderTimelineProps> = ({ steps }) => {
    return (
        <div className="flex items-center justify-between w-full my-4">
            {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                    <div className="flex flex-col items-center">
                        {/* Circle Indicator */}
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

                    {/* Line Connector */}
                    {index < steps.length - 1 && (
                        <div
                            className={`h-1 ${
                                steps[index + 1].completed ? "bg-green-500" : "bg-gray-300"
                            }`}
                            style={{
                                width: '10vw', // ใช้หน่วย vw เพื่อให้สัมพันธ์กับขนาดหน้าจอ
                                height: '2px', // ความหนาของเส้น
                                margin: '0 8px', // ช่องว่างระหว่างเส้นกับวงกลม
                            }}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};

export default OrderTimeline;
