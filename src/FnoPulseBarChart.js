import React from 'react';
import { Bar } from 'react-chartjs-2';

const FnoPulseBarChart = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        label: '%OI Change',
        data: data.map(item => item.oiChange),
        backgroundColor: [
          'rgba(75,192,192,0.7)',
          'rgba(255,99,132,0.7)',
          'rgba(255,206,86,0.7)',
          'rgba(54,162,235,0.7)'
        ],
      },
    ],
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true } }
  };

  return <Bar data={chartData} options={options} />;
};

export default FnoPulseBarChart;
