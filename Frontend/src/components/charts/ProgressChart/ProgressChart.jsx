// src/components/charts/ProgressChart/ProgressChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './ProgressChart.scss';

const ProgressChart = ({ modules, preAssessmentAvg, postAssessmentAvg }) => {
  // Prepare data for the chart
  const data = [
    {
      name: 'Average Score',
      'Pre-Assessment': preAssessmentAvg,
      'Post-Assessment': postAssessmentAvg,
      improvement: postAssessmentAvg - preAssessmentAvg
    },
  ];

  // Add individual module data if available
  if (modules && modules.length > 0) {
    modules.forEach(module => {
      if (module.preAssessmentScore !== undefined && module.postAssessmentScore !== undefined) {
        data.push({
          name: module.title,
          'Pre-Assessment': module.preAssessmentScore,
          'Post-Assessment': module.postAssessmentScore,
          improvement: module.postAssessmentScore - module.preAssessmentScore
        });
      }
    });
  }

  // Custom tooltip to show improvement percentage
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${label}`}</p>
          <p className="pre-score">
            <span className="dot pre-dot"></span>
            {`Pre-Assessment: ${payload[0].value}%`}
          </p>
          <p className="post-score">
            <span className="dot post-dot"></span>
            {`Post-Assessment: ${payload[1].value}%`}
          </p>
          {payload[1].value > payload[0].value && (
            <p className="improvement">
              {`Improvement: +${(payload[1].value - payload[0].value).toFixed(1)}%`}
            </p>
          )}
        </div>
      );
    }
  
    return null;
  };

  return (
    <div className="progress-chart">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis unit="%" domain={[0, 100]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="Pre-Assessment" fill="#8884d8" radius={[4, 4, 0, 0]} barSize={20} />
          <Bar dataKey="Post-Assessment" fill="#82ca9d" radius={[4, 4, 0, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
      
      <div className="chart-summary">
        <div className="summary-item">
          <span className="summary-label">Average Improvement:</span>
          <span className="summary-value">+{(postAssessmentAvg - preAssessmentAvg).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;