"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface ShowCaseProps {
    original: string;
    effect: string;
    ossHost: string;
}

const ShowCase: React.FC<ShowCaseProps> = ({ original, effect, ossHost }) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 处理鼠标拖动
    const handleMouseDown = () => {
        setIsDragging(true);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !containerRef.current) return;

        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const containerWidth = container.offsetWidth;

        // 计算百分比并限制在0-100之间
        const newPosition = Math.max(0, Math.min(100, (x / containerWidth) * 100));
        setSliderPosition(newPosition);
    };

    // 处理触摸事件
    const handleTouchStart = () => {
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!isDragging || !containerRef.current) return;

        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const containerWidth = container.offsetWidth;

        // 计算百分比并限制在0-100之间
        const newPosition = Math.max(0, Math.min(100, (x / containerWidth) * 100));
        setSliderPosition(newPosition);
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    // 添加全局事件监听器
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener("mouseup", handleGlobalMouseUp);
        window.addEventListener("touchend", handleGlobalMouseUp);

        return () => {
            window.removeEventListener("mouseup", handleGlobalMouseUp);
            window.removeEventListener("touchend", handleGlobalMouseUp);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative w-full aspect-video overflow-hidden rounded-xl"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
            {/* 原图（底层）*/}
            <div className="absolute inset-0 w-full h-full">
                <Image
                    src={`${ossHost}${original}`}
                    alt="原图"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    priority
                />
            </div>

            {/* 效果图（顶层，使用clip-path根据滑块位置显示）*/}
            <div className="absolute inset-0 w-full h-full">
                <div
                    className="absolute inset-0 w-full h-full"
                    style={{
                        clipPath: `inset(0 0 0 ${sliderPosition}%)`
                    }}
                >
                    <Image
                        src={`${ossHost}${effect}`}
                        alt="效果图"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                        priority
                    />
                </div>
            </div>

            {/* 滑块控制条 */}
            <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg cursor-grab active:cursor-grabbing"
                style={{
                    left: `${sliderPosition}%`,
                    transform: "translateX(50%)",
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                <div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                >
                    <div className="flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-3 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.707 3.293a1 1 0 010 1.414L6.414 9l4.293 4.293a1 1 0 01-1.414 1.414l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-3 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L13.586 9l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* 左侧标签 - 原图 */}
            <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 text-sm rounded-md">
                <small>原图</small>
            </div>

            {/* 右侧标签 - 效果图 */}
            <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 text-sm rounded-md">
                <small>吉卜力风格</small>
            </div>
        </div>
    );
};

export default ShowCase;