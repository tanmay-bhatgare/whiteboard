import React, { useEffect, useRef, useState } from "react";
import colorPalette from "./assets/color-palette.png";
import pencil from "./assets/pencil.png";
import eraser from "./assets/eraser.png";
import clear from "./assets/clear.png";
import StyleButton from "./StyleButton";

const App = () => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const wsRef = useRef(null);
  const scaleRef = useRef(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeBox, setActiveBox] = useState(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  //* Line Props
  const [lineWidth, setLineWidth] = useState(5);
  const [lineColor, setLineColor] = useState("white");
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [prevLineProps, setPrevLineProps] = useState({
    lineWidth: null,
    lineColor: null,
  });

  useEffect(() => {
    // Setup WebSocket connection
    wsRef.current = new WebSocket("ws://localhost:8000/ws");

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleDrawingEvent(data);
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket connection closed");
    };

    // Canvas setup
    const preventTouchScroll = (e) => e.preventDefault();
    document.addEventListener("touchmove", preventTouchScroll, {
      passive: false,
    });

    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * scaleRef.current;
    canvas.height = window.innerHeight * scaleRef.current;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const context = canvas.getContext("2d");
    context.scale(scaleRef.current, scaleRef.current);
    context.translate(1, 1);
    context.lineCap = "round";

    context.fillStyle = "#161622";
    context.fillRect(-1, -1, canvas.width, canvas.height);

    contextRef.current = context;
    setPrevLineProps({ lineWidth: 5, lineColor: "white" });

    return () => {
      document.removeEventListener("touchmove", preventTouchScroll);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.lineWidth = lineWidth;
      contextRef.current.strokeStyle = lineColor;
    }
  }, [lineWidth, lineColor]);

  const handleDrawingEvent = (data) => {
    const context = contextRef.current;
    if (!context) return;

    switch (data.type) {
      case "start":
        context.beginPath();
        context.moveTo(data.x, data.y);
        context.strokeStyle = data.color;
        context.lineWidth = data.lineWidth;
        break;
      case "draw":
        context.strokeStyle = data.color;
        context.lineWidth = data.lineWidth;
        context.lineTo(data.x, data.y);
        context.stroke();
        break;
      case "end":
        context.closePath();
        break;
      case "clear":
        const currentColor = context.strokeStyle;
        const currentWidth = context.lineWidth;

        context.fillStyle = "#161622";
        context.fillRect(
          -1,
          -1,
          canvasRef.current.width,
          canvasRef.current.height
        );

        context.strokeStyle = currentColor;
        context.lineWidth = currentWidth;
        break;
      default:
        break;
    }
  };

  const startDrawing = (event) => {
    setActiveBox(null);
    setIsColorPickerOpen(false);
    const { offsetX, offsetY } = getCoordinates(event);
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);

    // Send start drawing event
    wsRef.current.send(
      JSON.stringify({
        type: "start",
        x: offsetX,
        y: offsetY,
        color: lineColor,
        lineWidth: lineWidth,
      })
    );
  };

  const finishDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);

    // Send end drawing event
    wsRef.current.send(
      JSON.stringify({
        type: "end",
      })
    );
  };

  const draw = (event) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = getCoordinates(event);
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();

    // Send drawing event
    wsRef.current.send(
      JSON.stringify({
        type: "draw",
        x: offsetX,
        y: offsetY,
        color: lineColor,
        lineWidth: lineWidth,
      })
    );
  };

  const getCoordinates = (event) => {
    if (event.nativeEvent.touches) {
      const touch = event.nativeEvent.touches[0];
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top,
      };
    } else {
      return {
        offsetX: event.nativeEvent.offsetX,
        offsetY: event.nativeEvent.offsetY,
      };
    }
  };

  const saveCanvasImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = image;
    link.click();
  };

  const clearCanvas = () => {
    if (!contextRef.current || !canvasRef.current) return;
    contextRef.current.fillStyle = "#161622";
    contextRef.current.fillRect(
      -1,
      -1,
      canvasRef.current.width,
      canvasRef.current.height
    );

    // Send clear event to other clients
    wsRef.current.send(
      JSON.stringify({
        type: "clear",
      })
    );
  };

  const toggleBox = (boxName) => {
    setActiveBox((prev) => (prev === boxName ? null : boxName));
  };

  const toggleEraser = () => {
    if (!canvasRef.current || !contextRef.current) return;
    setPrevLineProps({ lineWidth: lineWidth, lineColor: lineColor });
    setLineColor("#161622");
    setLineWidth(20);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseMove={draw}
        onTouchStart={startDrawing}
        onTouchEnd={finishDrawing}
        onTouchMove={draw}
      />
      <div className="flex gap-2 absolute top-2 right-2">
        <button
          onClick={saveCanvasImage}
          className="bg-blue-500 rounded-md p-1.5 font-extrabold text-slate-300/80"
        >
          Download
        </button>
      </div>
      <div className="w-[100vw] flex justify-center items-center p-2 absolute bottom-0">
        <div className="relative w-full h-12 py-1 bg-[#232335] rounded-lg flex justify-evenly items-center">
          <StyleButton
            iconWidth={24}
            iconHeight={24}
            iconSrc={pencil}
            iconAlt="pencil"
            onClick={() => {
              setLineColor(prevLineProps.lineColor);
              setLineWidth(prevLineProps.lineWidth);
              toggleBox("range");
            }}
          />
          <StyleButton
            iconWidth={24}
            iconHeight={24}
            iconSrc={colorPalette}
            iconAlt="color palette"
            onClick={() => toggleBox("colors")}
          />
          <StyleButton
            iconWidth={24}
            iconHeight={24}
            iconSrc={eraser}
            iconAlt="eraser"
            onClick={toggleEraser}
          />
          <StyleButton
            iconWidth={24}
            iconHeight={24}
            iconSrc={clear}
            iconAlt="clear"
            onClick={clearCanvas}
          />
          {activeBox === "range" && (
            <div className="absolute bottom-[120%] transform w-40 bg-[#161625] p-2 rounded-lg shadow-xl">
              <input
                type="range"
                min="1"
                max="15"
                value={lineWidth}
                onChange={(e) => setLineWidth(parseInt(e.target.value, 10))}
                className="w-full cursor-pointer"
              />
              <div className="text-center text-white">
                Line Width: {lineWidth}px
              </div>
            </div>
          )}
          {isColorPickerOpen && (
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => {
                  setSelectedColor(e.target.value);
                  setLineColor(e.target.value);
                }}
                className="w-full h-12 cursor-pointer border border-gray-300 rounded-lg"
              />
              <button
                onClick={() => setIsColorPickerOpen(false)}
                className="mt-4 w-full bg-red-500 text-white py-2 px-4 rounded-lg shadow hover:bg-red-600"
              >
                Close
              </button>
            </div>
          )}
          {activeBox === "colors" && (
            <div className="absolute bottom-[120%] transform w-3/4 md:w-3/4 lg:w-[300px] max-w-[400px] flex justify-around bg-[#161625] p-2 rounded-lg shadow-xl">
              <button
                className="rounded-full bg-red-500 w-10 h-10"
                onClick={() => {
                  setLineColor("#ef4444");
                  setActiveBox(null);
                }}
              />
              <button
                className="rounded-full bg-blue-500 w-10 h-10"
                onClick={() => {
                  setLineColor("#3b82f6");
                  setActiveBox(null);
                }}
              />
              <button
                className="rounded-full bg-purple-500 w-10 h-10"
                onClick={() => {
                  setLineColor("#a855f7");
                  setActiveBox(null);
                }}
              />
              <button
                className="rounded-full bg-orange-500 w-10 h-10"
                onClick={() => {
                  setLineColor("#f97316");
                  setActiveBox(null);
                }}
              />
              <button
                className="rounded-full w-10 h-10 text-4xl"
                onClick={() => setIsColorPickerOpen(true)}
              >
                🎨
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default App;
