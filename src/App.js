import React, { useState, useEffect, useRef } from 'react';
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

const SimpleLinearRegression = () => {
  const [data] = useState([
    { x: 1, y: 2 },
    { x: 2, y: 3 },
    { x: 3, y: 5 },
    { x: 4, y: 4 },
  ]);
  const [initialW] = useState(Math.random() * 2 - 1);
  const [initialB] = useState(Math.random() * 4);
  const [bestW, setBestW] = useState(0);
  const [bestB, setBestB] = useState(0);
  const [currentW, setCurrentW] = useState(initialW);
  const [currentB, setCurrentB] = useState(initialB);
  const [loss, setLoss] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const canvasRef = useRef(null);
  const parabolaRef = useRef(null);

  useEffect(() => {
    const n = data.length;
    const sumX = data.reduce((sum, point) => sum + point.x, 0);
    const sumY = data.reduce((sum, point) => sum + point.y, 0);
    const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumXX = data.reduce((sum, point) => sum + point.x * point.x, 0);
    
    const bestFitW = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const bestFitB = (sumY - bestFitW * sumX) / n;
    
    setBestW(bestFitW);
    setBestB(bestFitB);
  }, [data]);

  useEffect(() => {
    const interpolatedW = initialW + (bestW - initialW) * (sliderValue / 100);
    const interpolatedB = initialB + (bestB - initialB) * (sliderValue / 100);
    setCurrentW(interpolatedW);
    setCurrentB(interpolatedB);

    const newLoss = data.reduce((sum, point) => {
      const pred = interpolatedW * point.x + interpolatedB;
      return sum + Math.pow(pred - point.y, 2);
    }, 0) / (2 * data.length);

    setLoss(newLoss);

    drawContourPlot(interpolatedW, interpolatedB);
    drawParabola(interpolatedW);
  }, [sliderValue, initialW, initialB, bestW, bestB, data]);

  const drawContourPlot = (w, b) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const wRange = { min: -1, max: 3 };
    const bRange = { min: -1, max: 5 };

    const calculateLoss = (w, b) => {
      return data.reduce((sum, point) => {
        const pred = w * point.x + b;
        return sum + Math.pow(pred - point.y, 2);
      }, 0) / (2 * data.length);
    };

    // Draw contour lines
    const contourLevels = [0.5, 1, 2, 4, 8, 16];
    contourLevels.forEach((level, index) => {
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
      ctx.strokeStyle = `rgba(0, 0, 255, ${0.3 + index * 0.1})`;
      ctx.stroke();
    });

    contourLevels.forEach((level, index) => {
      const x = width - 40;
      const y = height - (index * 30) - 20;
      ctx.fillStyle = `rgba(0, 0, 255, ${0.5 + index * 0.1})`;
      ctx.fillText(`Loss: ${level}`, x, y);
    });

    // Draw gradient descent path
    ctx.beginPath();
    ctx.moveTo(
      ((initialW - wRange.min) / (wRange.max - wRange.min)) * width,
      height - ((initialB - bRange.min) / (bRange.max - bRange.min)) * height
    );
    ctx.lineTo(
      ((w - wRange.min) / (wRange.max - wRange.min)) * width,
      height - ((b - bRange.min) / (bRange.max - bRange.min)) * height
    );
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw current position
    ctx.beginPath();
    ctx.arc(
      ((w - wRange.min) / (wRange.max - wRange.min)) * width,
      height - ((b - bRange.min) / (bRange.max - bRange.min)) * height,
      5,
      0,
      2 * Math.PI
    );
    ctx.fillStyle = 'red';
    ctx.fill();
  };

  const drawParabola = (currentW) => {
    const canvas = parabolaRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const wRange = { min: -1, max: 3 };
    const jRange = { min: 0, max: 10 };

    // Draw axes
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, height);
    ctx.strokeStyle = 'black';
    ctx.stroke();

    // Label axes
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.fillText('w', width - 10, height - 5);
    ctx.fillText('J(w)', 5, 15);

    // Draw parabola
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const w = wRange.min + (x / width) * (wRange.max - wRange.min);
      const j = calculateLoss(w, currentB);
      const y = height - ((j - jRange.min) / (jRange.max - jRange.min)) * height;
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = 'blue';
    ctx.stroke();

    // Draw current point
    const x = ((currentW - wRange.min) / (wRange.max - wRange.min)) * width;
    const y = height - ((loss - jRange.min) / (jRange.max - jRange.min)) * height;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
  };

  const calculateLoss = (w, b) => {
    return data.reduce((sum, point) => {
      const pred = w * point.x + b;
      return sum + Math.pow(pred - point.y, 2);
    }, 0) / (2 * data.length);
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

  return (
    <div style={{ width: '75vw', height: '80vw' }}>
      <h3>Simple Linear Regression with Loss Visualization</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ width: '45%', height: '25vw' }}>
          <Scatter data={chartData} options={options} />
          <p>Data points and regression line</p>
        </div>
        <div style={{ width: '45%', height: '25vw' }}>
          <canvas ref={canvasRef} width={300} height={300} style={{ width: '100%', height: '100%' }} />
          <p>Contour plot of loss function J(w,b)</p>
        </div>
        <div style={{ width: '45%', height: '25vw' }}>
          <canvas ref={parabolaRef} width={300} height={300} style={{ width: '100%', height: '100%' }} />
          <p>Loss J(w) as a function of w</p>
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={sliderValue}
        onChange={(e) => setSliderValue(Number(e.target.value))}
        style={{ width: '100%' }}
      />
      <p>w: {currentW.toFixed(3)}, b: {currentB.toFixed(3)}, Loss: {loss.toFixed(3)}</p>
    </div>
  );
};

export default SimpleLinearRegression;