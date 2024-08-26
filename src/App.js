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

const NeonLinearRegression = () => {
  const [data] = useState([
    { x: 1, y: 2 },
    { x: 4, y: 4 },
  ]);

  const [bestW, setBestW] = useState(0);
  const [bestB, setBestB] = useState(0);
  const [currentW, setCurrentW] = useState(0);
  const [currentB, setCurrentB] = useState(0);
  const [loss, setLoss] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);

  const canvasRef = useRef(null);

  useEffect(() => {
    calculateBestFit();
  }, [data]);

  useEffect(() => {
    const interpolatedW = bestW * (sliderValue / 100);
    const interpolatedB = bestB * (sliderValue / 100);
    setCurrentW(interpolatedW);
    setCurrentB(interpolatedB);
    setLoss(calculateLoss(interpolatedW, interpolatedB));
    drawContourPlot(interpolatedW, interpolatedB);
  }, [sliderValue, bestW, bestB, data]);

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
  };

  const calculateLoss = (w, b) => {
    return data.reduce((sum, point) => {
      const pred = w * point.x + b;
      return sum + Math.pow(pred - point.y, 2);
    }, 0) / (2 * data.length);
  };

  const drawContourPlot = (w, b) => {
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
    drawGradientDescentPath(ctx, width, height, wRange, bRange, w, b);
    drawCurrentPosition(ctx, width, height, wRange, bRange, w, b);
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
    const hue = 180 + index * 30;
    ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 0.5)`;
    ctx.stroke();
  };

  const drawLegend = (ctx, contourLevels, width, height) => {
    contourLevels.forEach((level, index) => {
      const x = width - 60;
      const y = height - (index * 20) - 10;
      const hue = 180 + index * 30;
      ctx.fillStyle = `hsla(${hue}, 100%, 50%, 1)`;
      ctx.fillText(`Loss: ${level}`, x, y);
    });
  };

  const drawGradientDescentPath = (ctx, width, height, wRange, bRange, w, b) => {
    ctx.beginPath();
    ctx.moveTo(
      ((bestW - wRange.min) / (wRange.max - wRange.min)) * width,
      height - ((bestB - bRange.min) / (bRange.max - bRange.min)) * height
    );
    ctx.lineTo(
      ((w - wRange.min) / (wRange.max - wRange.min)) * width,
      height - ((b - bRange.min) / (bRange.max - bRange.min)) * height
    );
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawCurrentPosition = (ctx, width, height, wRange, bRange, w, b) => {
    ctx.beginPath();
    ctx.arc(
      ((w - wRange.min) / (wRange.max - wRange.min)) * width,
      height - ((b - bRange.min) / (bRange.max - bRange.min)) * height,
      5,
      0,
      2 * Math.PI
    );
    ctx.fillStyle = 'rgba(255, 0, 255, 0.8)';
    ctx.fill();
  };

  const chartData = {
    datasets: [
      {
        label: 'Data Points',
        data: data,
        backgroundColor: 'rgba(0, 255, 255, 1)',
      },
      {
        label: 'Regression Line',
        data: [
          { x: 0, y: currentB },
          { x: 5, y: 5 * currentW + currentB },
        ],
        type: 'line',
        borderColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) {
            return null;
          }
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, chartArea.right, chartArea.top);
          gradient.addColorStop(0, 'rgba(0, 255, 255, 1)');
          gradient.addColorStop(0.5, 'rgba(255, 0, 255, 1)');
          gradient.addColorStop(1, 'rgba(255, 0, 128, 1)');
          return gradient;
        },
        borderWidth: 2,
        fill: false,
      },
    ],
  };

  const options = {
    scales: {
      x: { 
        min: 0, 
        max: 5,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)',
        },
      },
      y: { 
        min: 0, 
        max: 6,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)',
        },
      },
    },
    animation: { duration: 0 },
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px', 
      backgroundColor: '#1e1e2f',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
    }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>Neon Interactive Linear Regression</h2>
      
      <div style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.1)', 
        borderRadius: '4px', 
        padding: '15px', 
        marginBottom: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}>
        <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#00ffff' }}>Welcome to the Neon Regression Playground!</h3>
        <p>Click on the contour plot to change the regression line. Use the slider to interpolate between the initial and best fit line.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div style={{ border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
          <div style={{ padding: '15px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#ff00ff' }}>Data Points and Regression Line</h3>
          </div>
          <div style={{ height: '300px', padding: '15px' }}>
            <Scatter data={chartData} options={options} />
          </div>
        </div>

        <div style={{ border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
          <div style={{ padding: '15px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#ff00ff' }}>Loss Function Contour Plot</h3>
          </div>
          <div style={{ height: '300px', padding: '15px' }}>
            <canvas 
              ref={canvasRef} 
              width={300} 
              height={300} 
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
      </div>

      <div style={{ 
        border: '1px solid rgba(255, 255, 255, 0.2)', 
        borderRadius: '4px', 
        overflow: 'hidden', 
        marginBottom: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{ padding: '15px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#ff00ff' }}>Current Parameters</h3>
        </div>
        <div style={{ padding: '15px' }}>
          <p style={{ textAlign: 'center' }}>
            w: {currentW.toFixed(3)}, b: {currentB.toFixed(3)}, Loss: {loss.toFixed(3)}
          </p>
        </div>
      </div>

      <div style={{ 
        border: '1px solid rgba(255, 255, 255, 0.2)', 
        borderRadius: '4px', 
        overflow: 'hidden', 
        marginBottom: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        padding: '15px',
      }}>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={(e) => setSliderValue(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
};

export default NeonLinearRegression;