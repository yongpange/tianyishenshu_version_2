import React from 'react';

interface ZhexianProps {
  width?: number;
  height?: number;
  className?: string;
}

const ZhexianIcon: React.FC<ZhexianProps> = ({ 
  width = 24, 
  height = 24, 
  className = "" 
}) => {
  return (
    <svg 
      viewBox="0 0 1024 1024" 
      version="1.1" 
      xmlns="http://www.w3.org/2000/svg" 
      width={width} 
      height={height}
      className={className}
    >
      <path d="M113.777778 28.444444h56.888889v113.777778H113.777778zM113.777778 540.444444h56.888889v113.777778H113.777778zM113.777778 711.111111h56.888889v113.777778H113.777778zM113.777778 199.111111h56.888889v113.777778H113.777778zM113.777778 369.777778h56.888889v113.777778H113.777778zM113.777778 881.777778h56.888889v113.777778H113.777778z" fill="#666666"></path>
      <path d="M369.777778 938.666667h142.222222v56.888889h-142.222222zM568.888889 938.666667h142.222222v56.888889h-142.222222zM113.777778 938.666667h199.111111v56.888889H113.777778zM768 938.666667h142.222222v56.888889h-142.222222z" fill="#666666"></path>
    </svg>
    
  );
};

export default ZhexianIcon; 