import React, { useState, useEffect, useRef } from 'react';
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

const SimpleLinearRegression = () => {
  const [data, setData] = useState([
    { x: 1, y: 2 },
    { x: 4, y: 4 },
  ]);

  const [bestW, setBestW] = useState(0);
  const [bestB, setBestB] = useState(0);
  const [currentW, setCurrentW] = useState(0);
  const [currentB, setCurrentB] = useState(0);
  const [loss, setLoss] = useState(0);

  const canvasRef = useRef(null);

  useEffect(() => {
    calculateBestFit();
  }, [data]);

  useEffect(() => {
    drawContourPlot();
  }, [bestW, bestB, currentW, currentB, data]);

  const calculateBestFit = () => {
    const n = data.length;
    const sumX = data.reduce((sum, point) => sum + point.x, 0);
    const sumY = data.reduce((sum, point) => sum + point.y, 0);
    const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumXX = data.reduce((sum, point) => sum + point.x * point.x, 0);
    
    const newBestW = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const newBestB = (sumY - newBestW * sumX) / n;
    
    setBestW(newBestW);
    setBestB(newBestB);
    setCurrentW(newBestW);
    setCurrentB(newBestB);
  };

  const calculateLoss = (w, b) => {
    return data.reduce((sum, point) => {
      const pred = w * point.x + b;
      return sum + Math.pow(pred - point.y, 2);
    }, 0) / (2 * data.length);
  };

  const drawContourPlot = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const wRange = { min: -1, max: 3 };
    const bRange = { min: -1, max: 5 };

    const contourLevels = [0.5, 1, 2, 4, 8, 16];
    contourLevels.forEach((level, index) => {
      drawContourLine(ctx, width, height, wRange, bRange, level, index);
    });

    drawLegend(ctx, contourLevels, width, height);
    drawGradientDescentPath(ctx, width, height, wRange, bRange);
    drawCurrentPosition(ctx, width, height, wRange, bRange);
  };

  const drawContourLine = (ctx, width, height, wRange, bRange, level, index) => {
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const wValue = wRange.min + (x / width) * (wRange.max - wRange.min);
        const bValue = bRange.min + (y / height) * (bRange.max - bRange.min);
        const lossValue = calculateLoss(wValue, bValue);
        if (Math.abs(lossValue - level) < 0.1) {
          ctx.moveTo(x, height - y);
          ctx.lineTo(x + 1, height - y);
        }
      }
    }
    ctx.strokeStyle = `hsla(${210 + index * 30}, 100%, 50%, ${0.3 + index * 0.1})`;
    ctx.stroke();
  };

  const drawLegend = (ctx, contourLevels, width, height) => {
    contourLevels.forEach((level, index) => {
      const x = width - 60;
      const y = height - (index * 20) - 10;
      ctx.fillStyle = `hsla(${210 + index * 30}, 100%, 50%, ${0.5 + index * 0.1})`;
      ctx.fillText(`Loss: ${level}`, x, y);
    });
  };

  const drawGradientDescentPath = (ctx, width, height, wRange, bRange) => {
    ctx.beginPath();
    ctx.moveTo(
      ((bestW - wRange.min) / (wRange.max - wRange.min)) * width,
      height - ((bestB - bRange.min) / (bRange.max - bRange.min)) * height
    );
    ctx.lineTo(
      ((currentW - wRange.min) / (wRange.max - wRange.min)) * width,
      height - ((currentB - bRange.min) / (bRange.max - bRange.min)) * height
    );
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawCurrentPosition = (ctx, width, height, wRange, bRange) => {
    ctx.beginPath();
    ctx.arc(
      ((currentW - wRange.min) / (wRange.max - wRange.min)) * width,
      height - ((currentB - bRange.min) / (bRange.max - bRange.min)) * height,
      5,
      0,
      2 * Math.PI
    );
    ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
    ctx.fill();
  };

  const handleContourClick = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const width = canvas.width;
    const height = canvas.height;

    const wRange = { min: -1, max: 3 };
    const bRange = { min: -1, max: 5 };

    const newW = wRange.min + (x / width) * (wRange.max - wRange.min);
    const newB = bRange.max - (y / height) * (bRange.max - bRange.min);

    setCurrentW(newW);
    setCurrentB(newB);
    setLoss(calculateLoss(newW, newB));
  };

  const chartData = {
    datasets: [
      {
        label: 'Data Points',
        data: data,
        backgroundColor: 'rgba(75, 192, 192, 1)',
      },
      {
        label: 'Regression Line',
        data: [
          { x: 0, y: currentB },
          { x: 5, y: 5 * currentW + currentB },
        ],
        type: 'line',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        fill: false,
      },
    ],
  };

  const options = {
    scales: {
      x: { min: 0, max: 5 },
      y: { min: 0, max: 6 },
    },
    animation: { duration: 0 },
    maintainAspectRatio: false,
  };

  const addRandomDataPoint = () => {
    const newX = Math.random() * 5;
    const newY = Math.random() * 6;
    setData([...data, { x: newX, y: newY }]);
  };

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>Interactive Linear Regression</h2>
      
      <div className="alert" style={{ backgroundColor: '#e0f2fe', borderRadius: '4px', padding: '15px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Welcome to the Linear Regression Playground!</h3>
        <p>Click on the contour plot to change the regression line. Add new data points to see how it affects the best fit line.</p>
      </div>

      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #e0e0e0' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Data Points and Regression Line</h3>
          </div>
          <div style={{ height: '300px', padding: '15px' }}>
            <Scatter data={chartData} options={options} />
          </div>
        </div>

        <div className="card" style={{ border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #e0e0e0' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Loss Function Contour Plot</h3>
          </div>
          <div style={{ height: '300px', padding: '15px' }}>
            <canvas 
              ref={canvasRef} 
              width={300} 
              height={300} 
              style={{ width: '100%', height: '100%' }}
              onClick={handleContourClick}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '15px', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>Current Parameters</h3>
        </div>
        <div style={{ padding: '15px' }}>
          <p style={{ textAlign: 'center' }}>
            w: {currentW.toFixed(3)}, b: {currentB.toFixed(3)}, Loss: {loss.toFixed(3)}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button onClick={addRandomDataPoint} style={{ padding: '10px 15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Add Random Data Point
        </button>
      </div>
    </div>
  );
};

export default SimpleLinearRegression;