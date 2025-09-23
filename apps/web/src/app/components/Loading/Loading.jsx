import React from 'react';
import './Loading.css';

const Loading = ({ text = "Carregando", subtext = "Aguarde um momento..." }) => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <div className="loading-text">
        {text}<span className="loading-dots"></span>
      </div>
      {subtext && <div className="loading-subtext">{subtext}</div>}
    </div>
  );
};

export default Loading;
