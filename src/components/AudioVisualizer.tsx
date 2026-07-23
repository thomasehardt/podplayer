import React, { useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';

export const AudioVisualizer: React.FC = () => {
  const { analyserNode, isPlaying, visualizerEnabled } = usePlayer();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!visualizerEnabled || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 16;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animationFrameRef.current = requestAnimationFrame(renderFrame);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (analyserNode && isPlaying) {
        analyserNode.getByteFrequencyData(dataArray);
      } else if (isPlaying) {
        // Fallback smooth wave generator when CORS or Analyser is inactive
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.floor(Math.sin(Date.now() * 0.005 + i) * 60 + 80);
        }
      } else {
        dataArray.fill(10);
      }

      const barWidth = (width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;

        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(1, '#06b6d4');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);

        x += barWidth;
      }
    };

    renderFrame();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyserNode, isPlaying, visualizerEnabled]);

  if (!visualizerEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="visualizer-canvas"
      width={100}
      height={32}
      title="Audio Frequency Visualizer"
    />
  );
};
