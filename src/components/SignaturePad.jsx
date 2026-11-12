import React, { useEffect, useRef, useState } from 'react';

export default function SignaturePad({ signature = '', signer = 'chairman', onSave }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    if (!signature || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const image = new Image();
    image.onload = () => {
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      setHasInk(true);
    };
    image.src = signature;
  }, [signature]);

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (canvas.height / bounds.height)
    };
  };

  const startDrawing = (event) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const point = getPoint(event);
    drawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.strokeStyle = '#142b49';
    context.lineWidth = 4;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    setHasInk(true);
  };

  const continueDrawing = (event) => {
    if (!drawingRef.current) return;
    const point = getPoint(event);
    const context = canvasRef.current.getContext('2d');
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const stopDrawing = () => {
    drawingRef.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  };

  const saveSignature = () => {
    if (!hasInk) return;
    onSave(canvasRef.current.toDataURL('image/png'));
  };

  return (
    <div className="signature-pad-wrap">
      <canvas
        ref={canvasRef}
        className="signature-pad"
        width="900"
        height="220"
        aria-label={`Draw the ${signer}'s signature here`}
        onPointerDown={startDrawing}
        onPointerMove={continueDrawing}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
        onLostPointerCapture={stopDrawing}
      />
      <div className="signature-pad-actions">
        <button type="button" className="secondary-btn" onClick={clearSignature}>Clear</button>
        <button type="button" className="primary-btn" disabled={!hasInk} onClick={saveSignature}>Save signature</button>
      </div>
    </div>
  );
}