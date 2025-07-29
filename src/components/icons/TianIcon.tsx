import React from 'react';

interface TianIconProps {
  width?: number;
  height?: number;
  className?: string;
}

const TianIcon: React.FC<TianIconProps> = ({ 
  width = 60, 
  height = 60, 
  className = "" 
}) => {
  return (
    <svg 
      version="1.1" 
      id="图层_1" 
      xmlns="http://www.w3.org/2000/svg" 
      xmlnsXlink="http://www.w3.org/1999/xlink" 
      x="0px" 
      y="0px"
      viewBox="0 0 60 60" 
      xmlSpace="preserve"  
      width={width} 
      height={height}
      className={className}
    >
      <style type="text/css">
        {`.stabg{fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-miterlimit:10;}`}
      </style>
      <path 
        className="stabg" 
        d="M9.9,16.3l0.1,7.4c0,0.8-0.6,1.4-1.4,1.4l-6.4,0.1c-0.3,0-0.4-0.2-0.4-0.5c2-14.1,11.3-19.1,14.4-20.4
        c0.5-0.2,1,0.2,1,0.7l0.1,50.4c0,0.8-0.8,1.2-1.5,0.8C12,53.8,2.3,46.5,1.9,35.1c0-0.3,0.2-0.5,0.5-0.5l6.5,0c0.7,0,1.2,0.6,1.2,1.3
        c0,2.3,0,7.3,0,8.3 M50.1,16.3l-0.1,7.4c0,0.8,0.6,1.4,1.4,1.4l6.4,0.1c0.3,0,0.4-0.2,0.4-0.5c-2-14.1-11.3-19.1-14.4-20.4
        c-0.5-0.2-1,0.2-1,0.7l-0.1,50.4c0,0.8,0.8,1.2,1.5,0.8c3.8-2.4,13.4-9.8,13.9-21.1c0-0.3-0.2-0.5-0.5-0.5l-6.5,0
        c-0.7,0-1.2,0.6-1.2,1.3c0,2.3,0,7.3,0,8.3 M21.8,2.1h16.7 M21.8,57.9h16.7 M22,10.1h16.5 M21,16.9h18.4 M21.3,27.9
        c11.6-5.4,8.8-17.8,8.8-17.8 M30.5,17c0,0,0,7.1,8.6,11 M22.7,35.5h12.4c0.2,0,0.3,0.3,0.1,0.4c-2.3,1.9-11.7,10-12.6,12.7
        c0,0-2.2,4.4,2.2,4.3s10.9,0,10.9,0s3.1,0.5,3.2-5.8"
      />
    </svg>
  );
};

export default TianIcon; 