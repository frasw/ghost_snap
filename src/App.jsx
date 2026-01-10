import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import starWarsImg from './assets/starwars.webp';

const GhostSnapApp = () => {
  const canvasRef = useRef(null);
  const fabricCanvas = useRef(null);
  
  // References for canvas interaction management
  const ghostObject = useRef(null);       // Visual indicator for snap position
  const staticPlaceholder = useRef(null); // Static visual clone remaining at start position
  const activeObject = useRef(null);      // The object currently being manipulated
  const dragTimer = useRef(null);         // Debounce timer for ghost appearance
  
  // Configuration constants
  const timeHolder = 60;                  // Delay in ms before ghost appearance
  const SNAP_THRESHOLD = 20;              // Pixel threshold for center alignment

  // Interface State
  const [showGrid, setShowGrid] = useState(true);
  const [restrictedMode, setRestrictedMode] = useState(true);
  const restrictedModeRef = useRef(true); 
  
  // History State
  const [history, setHistory] = useState([]); 

  // Synchronizes the ref with the current state to allow access within Fabric event closures
  useEffect(() => {
    restrictedModeRef.current = restrictedMode;
  }, [restrictedMode]);

  // Canvas Initialization and Event Binding
  useEffect(() => {
    if (!fabricCanvas.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#f3f3f3',
        selection: true,
        renderOnAddRemove: true
      });
      
      fabricCanvas.current = canvas;

      /**
       * Removes all temporary static placeholders from the canvas
       * to ensure a clean state during interactions.
       */
      const clearAllPlaceholders = () => {
          const objects = canvas.getObjects();
          objects.forEach((obj) => {
              if (obj.myType === 'static_placeholder') {
                  canvas.remove(obj);
              }
          });
      };

      // ----------------------------------------------------------------
      // Event: Mouse Down (Interaction Start)
      // ----------------------------------------------------------------
      canvas.on('mouse:down', (e) => {
        if (!e.target) return;
        
        // Captures current state for undo history
        const currentState = JSON.stringify(canvas.toJSON());
        setHistory(prev => [...prev, currentState]);

        clearAllPlaceholders();
        const obj = e.target;
        activeObject.current = obj;

        // Temporarily disables editing for text objects to prevent conflicts during drag
        if (obj.type === 'i-text') {
            obj.exitEditing(); 
            obj.set({ lockEditing: true, editable: false });
        }

        // Generates the static placeholder clone
        obj.clone().then((cloned) => {
            // Verifies the interaction is still active
            if (!activeObject.current) return;

            cloned.set({
                myType: 'static_placeholder',
                selectable: false, 
                evented: false,
                opacity: 0.3,
                stroke: '#777',
                strokeDashArray: [5, 5]
            });
            
            canvas.add(cloned);
            canvas.sendToBack(cloned);
        });

        // Hides the active object to simulate "invisible drag"
        obj.set({ 
            opacity: 0,
            hasControls: false,
            hasBorders: false
        });
        
        canvas.requestRenderAll();
      });

      // ----------------------------------------------------------------
      // Event: Object Moving (Drag Process)
      // ----------------------------------------------------------------
      canvas.on('object:moving', (e) => {
        const obj = e.target;
        if (!obj) return;

        // Resets timer and hides ghost on movement
        if (dragTimer.current) clearTimeout(dragTimer.current);
        if (ghostObject.current) ghostObject.current.set({ visible: false });

        // Initiates delay timer for ghost appearance
        dragTimer.current = setTimeout(() => {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const objCenter = obj.getCenterPoint();

            let snapX = null;
            let snapY = null;

            // Calculates alignment with center axes
            if (Math.abs(objCenter.x - centerX) < SNAP_THRESHOLD) snapX = centerX;
            if (Math.abs(objCenter.y - centerY) < SNAP_THRESHOLD) snapY = centerY;

            // Determines visibility based on mode (Restricted vs Free)
            let shouldShowGhost = false;
            if (restrictedModeRef.current) {
                shouldShowGhost = snapX !== null || snapY !== null;
            } else {
                shouldShowGhost = true;
            }

            if (shouldShowGhost) {
                const ghostLeft = snapX !== null ? snapX : obj.left;
                const ghostTop = snapY !== null ? snapY : obj.top;

                // Instantiates the ghost object if missing
                if (!ghostObject.current) {
                    let ghostShape;
                    
                    // Determines shape type (Circle vs Rect/Image/Text)
                    if (obj.type === 'circle') {
                        const scaledRadius = (obj.width * obj.scaleX) / 2;
                        ghostShape = new fabric.Circle({
                            radius: scaledRadius,
                            originX: 'center', originY: 'center',
                            fill: 'rgba(0, 123, 255, 0.4)',
                            stroke: '#007bff', strokeWidth: 2, strokeDashArray: [8, 4],
                            selectable: false, evented: false, visible: false
                        });
                    } else {
                        ghostShape = new fabric.Rect({
                            width: obj.getScaledWidth(),
                            height: obj.getScaledHeight(),
                            originX: 'center', originY: 'center',
                            fill: 'rgba(0, 123, 255, 0.4)',
                            stroke: '#007bff', strokeWidth: 2, strokeDashArray: [8, 4],
                            selectable: false, evented: false, visible: false
                        });
                    }
                    
                    canvas.add(ghostShape);
                    ghostObject.current = ghostShape;
                }

                // Updates ghost properties to match active object
                ghostObject.current.set({
                    left: ghostLeft,
                    top: ghostTop,
                    angle: obj.angle,
                    visible: true,
                    scaleX: 1, scaleY: 1,
                    width: obj.type !== 'circle' ? obj.getScaledWidth() : undefined,
                    height: obj.type !== 'circle' ? obj.getScaledHeight() : undefined,
                    radius: obj.type === 'circle' ? (obj.getScaledWidth() / 2) : undefined
                });
                
                ghostObject.current.setCoords();
                canvas.requestRenderAll();
            }
        }, timeHolder);
      });

      // ----------------------------------------------------------------
      // Event: Mouse Up (Interaction End)
      // ----------------------------------------------------------------
      canvas.on('mouse:up', () => {
        if (dragTimer.current) clearTimeout(dragTimer.current);
        
        const obj = activeObject.current;

        if (obj) {
            // Applies snap coordinates if ghost is visible
            if (ghostObject.current && ghostObject.current.visible) {
                obj.set({
                    left: ghostObject.current.left,
                    top: ghostObject.current.top,
                    originX: 'center', originY: 'center'
                });
            }
            
            // Restores original object state
            obj.set({ 
                opacity: 1,
                hasControls: true,
                hasBorders: true
            });
            
            // Restores text editing capabilities
            if (obj.type === 'i-text') {
                obj.set({ lockEditing: false, editable: true });
            }

            obj.setCoords();
        }

        clearAllPlaceholders();

        // Destroys the ghost instance to allow shape regeneration on next click
        if (ghostObject.current) {
            canvas.remove(ghostObject.current);
            ghostObject.current = null;
        }

        activeObject.current = null;
        canvas.requestRenderAll();
      });
    }

    return () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
        fabricCanvas.current = null;
      }
    };
  }, []);

  /**
   * Reverts the canvas to the previous state using JSON serialization.
   * Utilizes the Promise-based loadFromJSON method to ensure synchronization.
   */
  const handleUndo = () => {
      if (history.length === 0 || !fabricCanvas.current) return;
      
      const previousState = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      
      fabricCanvas.current.loadFromJSON(previousState).then((canvas) => {
          canvas.renderAll();
          ghostObject.current = null;
          activeObject.current = null;
          staticPlaceholder.current = null;
      });
  };

  // ----------------------------------------------------------------
  // Canvas Helper Functions
  // ----------------------------------------------------------------
  const addRect = () => {
    if(!fabricCanvas.current) return;
    const rect = new fabric.Rect({
      left: 150, top: 150, fill: '#ff6b6b', width: 100, height: 100,
      originX: 'center', originY: 'center', cornerRadius: 8
    });
    fabricCanvas.current.add(rect);
    fabricCanvas.current.setActiveObject(rect);
  };

  const addCircle = () => {
    if(!fabricCanvas.current) return;
    const circle = new fabric.Circle({
      left: 300, top: 200, radius: 50, fill: '#4ecdc4',
      originX: 'center', originY: 'center'
    });
    fabricCanvas.current.add(circle);
    fabricCanvas.current.setActiveObject(circle);
  };

  const addText = () => {
    if(!fabricCanvas.current) return;
    const text = new fabric.IText('GhostSnap', {
      left: 400, top: 100, fontSize: 32, fontFamily: 'Arial',
      originX: 'center', originY: 'center', fill: '#333'
    });
    fabricCanvas.current.add(text);
    fabricCanvas.current.setActiveObject(text);
  };

  const addImage = () => {
    if (!fabricCanvas.current) return;

    fabric.FabricImage.fromURL(starWarsImg).then((img) => {
        img.scaleToWidth(150);
        img.set({
            left: 400, 
            top: 300, 
            originX: 'center', 
            originY: 'center'
        });
        fabricCanvas.current.add(img);
        fabricCanvas.current.setActiveObject(img);
        fabricCanvas.current.requestRenderAll();
    }).catch(err => {
        console.error("Error loading image asset:", err);
    });
  };

  const clearCanvas = () => {
    if(!fabricCanvas.current) return;
    setHistory(prev => [...prev, JSON.stringify(fabricCanvas.current.toJSON())]);
    fabricCanvas.current.clear();
    fabricCanvas.current.backgroundColor = '#f3f3f3';
    ghostObject.current = null;
    activeObject.current = null;
  };

  // Styles Configuration
  const styles = {
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', fontFamily: 'sans-serif' },
    controls: { marginBottom: '10px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
    btn: { padding: '10px 15px', margin: '5px', cursor: 'pointer', borderRadius: '5px', border: 'none', color: 'white', fontWeight: 'bold' },
    canvasWrapper: { position: 'relative', border: '4px solid white', borderRadius: '10px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', overflow: 'hidden' },
    centerLineV: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', backgroundColor: 'rgba(0, 123, 255, 0.3)', pointerEvents: 'none', zIndex: 10 },
    centerLineH: { position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', backgroundColor: 'rgba(0, 123, 255, 0.3)', pointerEvents: 'none', zIndex: 10 }
  };

  return (
    <div style={styles.container}>
      <h1>GhostSnap <span style={{fontSize:'0.6em', color:'#777'}}></span></h1>
      <p>1. Trascina. 2. Fermati {timeHolder/1000}s. 3. Rilascia.</p>
      
      <div style={styles.controls}>
        <button onClick={addRect} style={{...styles.btn, background:'#ff6b6b'}}>+ Rect</button>
        <button onClick={addCircle} style={{...styles.btn, background:'#4ecdc4'}}>+ Circle</button>
        <button onClick={addImage} style={{...styles.btn, background:'#9b59b6'}}>+ Img</button>
        <button onClick={addText} style={{...styles.btn, background:'#333'}}>+ Text</button>
        <button onClick={clearCanvas} style={{...styles.btn, background:'#999'}}>Clear</button>
        
        <button 
            onClick={handleUndo} 
            disabled={history.length === 0}
            style={{...styles.btn, background: history.length > 0 ? '#f39c12' : '#ccc', cursor: history.length > 0 ? 'pointer' : 'not-allowed'}}
        >
            ↩ Indietro
        </button>

        <label style={{marginLeft: '15px', display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#555'}}>
            <input 
                type="checkbox" 
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                style={{width: '18px', height: '18px', marginRight: '8px', cursor: 'pointer'}}
            />
            Griglia
        </label>

        <label style={{marginLeft: '15px', display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#555'}}>
            <input 
                type="checkbox" 
                checked={restrictedMode}
                onChange={(e) => setRestrictedMode(e.target.checked)}
                style={{width: '18px', height: '18px', marginRight: '8px', cursor: 'pointer'}}
            />
            Vincolato alla Griglia
        </label>
      </div>

      <div style={styles.canvasWrapper}>
        <canvas ref={canvasRef} />
        {showGrid && (
            <>
                <div style={styles.centerLineV} />
                <div style={styles.centerLineH} />
            </>
        )}
      </div>
    </div>
  );
};

export default GhostSnapApp;