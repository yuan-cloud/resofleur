/**
 * FlowerButton Component
 * 
 * Beautiful animated button with 6 rotating flower clusters on hover
 * Original Resofleur aesthetic
 */

import React from 'react';

interface FlowerButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export default function FlowerButton({ onClick, children, disabled, className = '' }: FlowerButtonProps) {
  return (
    <button 
      className={`btn ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="wrapper">
        {/* 6 Flower clusters positioned around the button */}
        <div className="flower flower1">
          <div className="petal one"></div>
          <div className="petal two"></div>
          <div className="petal three"></div>
          <div className="petal four"></div>
        </div>
        <div className="flower flower2">
          <div className="petal one"></div>
          <div className="petal two"></div>
          <div className="petal three"></div>
          <div className="petal four"></div>
        </div>
        <div className="flower flower3">
          <div className="petal one"></div>
          <div className="petal two"></div>
          <div className="petal three"></div>
          <div className="petal four"></div>
        </div>
        <div className="flower flower4">
          <div className="petal one"></div>
          <div className="petal two"></div>
          <div className="petal three"></div>
          <div className="petal four"></div>
        </div>
        <div className="flower flower5">
          <div className="petal one"></div>
          <div className="petal two"></div>
          <div className="petal three"></div>
          <div className="petal four"></div>
        </div>
        <div className="flower flower6">
          <div className="petal one"></div>
          <div className="petal two"></div>
          <div className="petal three"></div>
          <div className="petal four"></div>
        </div>
        <div className="text">{children}</div>
      </div>
    </button>
  );
}
