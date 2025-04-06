import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as math from 'mathjs';

const EntropyVisualization = () => {
  // State for probability distribution
  const [distribution, setDistribution] = useState([
    { name: 'A', probability: 0.25 },
    { name: 'B', probability: 0.25 },
    { name: 'C', probability: 0.25 },
    { name: 'D', probability: 0.25 },
  ]);
  
  // UI state
  const [selectedElement, setSelectedElement] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  
  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [targetDistribution, setTargetDistribution] = useState(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const animationRef = useRef({ progress: 0 });
  
  // Entropy and history state
  const [entropy, setEntropy] = useState(0);
  const [maxEntropy, setMaxEntropy] = useState(0);
  const [entropyHistory, setEntropyHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Calculate entropy: -∑p_i * log2(p_i)
  const calculateEntropy = (dist) => {
    return -dist.reduce((sum, item) => {
      const p = item.probability;
      // Handle edge case: 0 * log(0) = 0
      return sum + (p > 0 ? p * math.log2(p) : 0);
    }, 0);
  };
  
  // Calculate maximum possible entropy for this number of elements
  const calculateMaxEntropy = (n) => {
    return math.log2(n); // Max entropy is log2(n) for uniform distribution
  };
  
  // Normalize probabilities to ensure they sum to 1
  const normalizeDistribution = (dist) => {
    const sum = dist.reduce((sum, item) => sum + item.probability, 0);
    return dist.map(item => ({
      ...item,
      probability: item.probability / sum
    }));
  };
  
  // Calculate percentage for entropy visualization
  const entropyPercentage = Math.round((entropy / maxEntropy) * 100) || 0;
  
  // Initialize entropy calculation and history
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Run mobile check and set up listener
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Initialize entropy and history
    const initialEntropy = calculateEntropy(distribution);
    setEntropy(initialEntropy);
    setMaxEntropy(calculateMaxEntropy(distribution.length));
    setEntropyHistory([{ index: 0, entropy: initialEntropy }]);
    setHistoryIndex(1);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Update entropy when distribution changes
  useEffect(() => {
    const n = distribution.length;
    const newEntropy = calculateEntropy(distribution);
    setMaxEntropy(calculateMaxEntropy(n));
    setEntropy(newEntropy);
    
    // Add to entropy history if not during animation
    if (!isAnimating) {
      // Only add to history if distribution was manually changed
      setEntropyHistory(prev => {
        // Keep only the last 100 records to prevent excessive memory usage
        const newHistory = [...prev, { index: historyIndex, entropy: newEntropy }].slice(-100);
        return newHistory;
      });
      
      // Increment history index for next change
      setHistoryIndex(prev => prev + 1);
    }
  }, [distribution, isAnimating]);
  
  // Animation effect for smooth transitions between distributions
  useEffect(() => {
    if (!isAnimating || !targetDistribution) return;
    
    // Animation duration in milliseconds
    const duration = 1000;
    let startTime = null;
    let animationFrameId = null;
    let animationEntropy = [];
    let startIndex = historyIndex; // Store the current historyIndex value
    
    // Reset the animation progress reference
    animationRef.current.progress = 0;
    
    // Store initial distribution for interpolation
    const initialDistribution = [...distribution];
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Update both the state and the ref for animation progress
      animationRef.current.progress = progress;
      setAnimationProgress(progress);
      
      // Interpolate between initial and target distribution
      const currentDist = initialDistribution.map((item, index) => {
        return {
          ...item,
          probability: item.probability + (targetDistribution[index].probability - item.probability) * progress
        };
      });
      
      // Calculate entropy for this interpolated distribution
      const currentEntropy = calculateEntropy(currentDist);
      
      // Store for history with incremental indices
      animationEntropy.push({ 
        index: startIndex + animationEntropy.length, 
        entropy: currentEntropy 
      });
      
      // Update the distribution (this will trigger a render)
      setDistribution(currentDist);
      
      if (progress < 1) {
        // Continue animation
        animationFrameId = requestAnimationFrame(animate);
      } else {
        // Animation complete - ensure final values are exact
        setDistribution(targetDistribution);
        
        // Add all animation entropy values to history
        setEntropyHistory(prev => {
          const newHistory = [...prev, ...animationEntropy].slice(-100);
          return newHistory;
        });
        
        // Update history index for next manual change
        setHistoryIndex(startIndex + animationEntropy.length);
        
        // Reset animation states
        setAnimationProgress(0);
        animationRef.current.progress = 0;
        setIsAnimating(false);
        setTargetDistribution(null);
      }
    };
    
    // Start the animation
    animationFrameId = requestAnimationFrame(animate);
    
    // Cleanup function
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isAnimating, targetDistribution]);
  
  // Create preset distributions with animation
  const animateToDistribution = (newDistribution) => {
    // If already animating, immediately set to the new target 
    if (isAnimating) {
      setDistribution(newDistribution);
      setIsAnimating(false);
      setTargetDistribution(null);
      setAnimationProgress(0);
      return;
    }
    
    // Start a new animation
    setAnimationProgress(0);
    setTargetDistribution(newDistribution);
    setIsAnimating(true);
    setSelectedElement(null);
  };
  
  const setUniform = () => {
    const n = distribution.length;
    const uniform = distribution.map(item => ({
      ...item,
      probability: 1/n
    }));
    animateToDistribution(uniform);
  };
  
  const setSkewed = () => {
    // Create a highly skewed distribution
    const skewed = [...distribution];
    const n = skewed.length;
    
    // First element gets 0.7, others share the rest
    for (let i = 0; i < n; i++) {
      skewed[i] = {
        ...skewed[i],
        probability: i === 0 ? 0.7 : 0.3/(n-1)
      };
    }
    animateToDistribution(skewed);
  };
  
  const setZeroEntropy = () => {
    // One element gets all probability
    const zeroDist = distribution.map((item, index) => ({
      ...item,
      probability: index === 0 ? 1 : 0
    }));
    animateToDistribution(zeroDist);
  };
  
  // Add or remove elements
  const addElement = () => {
    if (isAnimating) return; // Prevent modification during animation
    
    if (distribution.length < (isMobile ? 5 : 8)) {
      const newChar = String.fromCharCode(65 + distribution.length); // A, B, C, ...
      const newDist = [...distribution, { name: newChar, probability: 0.1 }];
      setDistribution(normalizeDistribution(newDist));
      setSelectedElement(null);
    }
  };
  
  const removeElement = () => {
    if (isAnimating) return; // Prevent modification during animation
    
    if (distribution.length > 2) {
      const newDist = distribution.slice(0, -1);
      setDistribution(normalizeDistribution(newDist));
      setSelectedElement(null);
    }
  };
  
  // Handle element selection for editing
  const handleElementSelect = (index) => {
    if (isAnimating) return; // Prevent selection during animation
    
    if (selectedElement === index) {
      setSelectedElement(null);
    } else {
      setSelectedElement(index);
    }
  };
  
  // Handle slider change for the selected element
  const handleSliderChange = (e) => {
    if (isAnimating) return; // Prevent changes during animation
    
    if (selectedElement !== null) {
      const value = parseFloat(e.target.value);
      const newDist = [...distribution];
      newDist[selectedElement] = {
        ...newDist[selectedElement],
        probability: value
      };
      setDistribution(normalizeDistribution(newDist));
    }
  };
  
  // Custom tooltip to show exact probability
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-teal-50 p-3 border border-teal-200 rounded shadow-md">
          <p className="font-semibold text-teal-800">{data.name}</p>
          <p className="text-teal-700">Probability: {data.probability.toFixed(4)}</p>
        </div>
      );
    }
    return null;
  };
  
  // Custom tooltip for the line chart
  const LineChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-teal-50 p-2 border border-teal-200 rounded shadow-md">
          <p className="text-sm font-semibold text-teal-800">Change #{label}</p>
          <p className="text-xs text-teal-700">Entropy: {payload[0].value.toFixed(3)}</p>
        </div>
      );
    }
    return null;
  };
  
  // Clear entropy history
  const clearHistory = () => {
    // Keep only the current value
    const currentEntropy = entropyHistory[entropyHistory.length - 1];
    setEntropyHistory([{ ...currentEntropy, index: 0 }]);
    setHistoryIndex(1);
  };
  
  // Get color based on probability value for gradient effect
  const getBarColor = (index) => {
    // Use a gradient from teal to blue for non-selected items
    if (index === selectedElement) {
      return '#06b6d4'; // Bright teal for selected item
    }
    
    // Special case for zero probability - make it visually distinct but still visible
    if (distribution[index].probability === 0) {
      return '#94a3b8'; // Slate-400 - visible but muted
    }
    
    // Gradient from blue to teal for regular bars
    const colors = [
      '#0369a1', // Dark blue
      '#0284c7', // Blue
      '#0891b2', // Blue-teal
      '#06b6d4', // Teal
      '#14b8a6'  // Lighter teal
    ];
    
    // Use a color based on the index
    return colors[index % colors.length];
  };
  
  return (
    <div className="p-4 w-full h-full bg-gradient-to-br from-cyan-50 to-teal-50" style={{color: '#0e7490'}}>
      <h1 className="text-2xl font-bold mb-4 text-center text-cyan-900">Entropy Visualizer</h1>
      
      {/* Entropy display with progress bar */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-md border border-cyan-100">
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold text-cyan-900">Current Entropy:</span>
          <div className="flex items-center">
            <span className="font-bold text-cyan-700">{entropy.toFixed(3)}</span>
            {isAnimating && (
              <div className="ml-2 inline-block">
                <div className="animate-pulse h-2 w-2 bg-cyan-500 rounded-full inline-block mx-0.5"></div>
                <div className="animate-pulse h-2 w-2 bg-cyan-500 rounded-full inline-block mx-0.5" style={{ animationDelay: '0.2s' }}></div>
                <div className="animate-pulse h-2 w-2 bg-cyan-500 rounded-full inline-block mx-0.5" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}
          </div>
        </div>
        
        <div className="w-full bg-cyan-100 rounded-full h-4 mb-1">
          <div 
            className="bg-gradient-to-r from-cyan-500 to-teal-400 h-4 rounded-full transition-all duration-300" 
            style={{ width: `${entropyPercentage}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-xs text-cyan-600">
          <span>0</span>
          <span>Max: {maxEntropy.toFixed(3)}</span>
        </div>
        
        {/* Entropy history chart */}
        {entropyHistory.length > 1 && (
          <div className="mt-4 border-t border-cyan-100 pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-sm text-cyan-900">History</span>
              <div className="flex items-center gap-2">
                {isAnimating && (
                  <span className="text-xs text-teal-600 animate-pulse">Recording...</span>
                )}
                <button 
                  onClick={clearHistory}
                  disabled={isAnimating}
                  className="text-xs px-2 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded border border-cyan-200 disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="h-32 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={entropyHistory}
                  margin={{ top: 5, right: 10, left: 0, bottom: 15 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0f2f1" />
                  <XAxis 
                    dataKey="index" 
                    label={{ value: 'Changes', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#0e7490' }}
                    tick={false}
                    axisLine={{ stroke: '#e0f2f1' }}
                  />
                  <YAxis 
                    domain={[0, maxEntropy]} 
                    tick={{ fontSize: 10, fill: '#0e7490' }}
                    width={25}
                  />
                  <Tooltip content={<LineChartTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="entropy" 
                    stroke="#0891b2" 
                    strokeWidth={2} 
                    dot={false}
                    isAnimationActive={!isAnimating} // Disable animation during our custom animations
                    activeDot={{ r: 4, stroke: '#0891b2', strokeWidth: 1, fill: '#22d3ee' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-cyan-600 italic text-center">
              Track how entropy changes as you modify the distribution
            </div>
          </div>
        )}
      </div>
      
      {/* Distribution visualization */}
      <div className="mb-4 bg-white rounded-lg shadow-md p-4 border border-cyan-100">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-cyan-900">Probability Distribution</h2>
          <span className="text-sm text-cyan-600">
            Tap any element to adjust
          </span>
        </div>
        
        {/* Element buttons for selecting even zero probability elements */}
        <div className="flex flex-wrap gap-2 mb-3">
          {distribution.map((item, index) => (
            <button
              key={index}
              onClick={() => handleElementSelect(index)}
              className={`px-3 py-1 rounded-full text-white text-sm transition-all ${
                selectedElement === index
                  ? 'bg-cyan-600 ring-2 ring-cyan-300'
                  : item.probability === 0
                  ? 'bg-slate-400'
                  : 'bg-teal-500'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
        
        <div className="h-64 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={distribution}
              margin={{ top: 10, right: 5, left: 5, bottom: 20 }}
              barGap={isMobile ? 2 : 10}
              onClick={(data) => {
                if (data && data.activeTooltipIndex !== undefined) {
                  handleElementSelect(data.activeTooltipIndex);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0f2f1" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 16, fontWeight: 'bold', fill: '#0e7490' }} 
                onClick={(data) => {
                  // This allows clicking on axis labels too
                  if (data && data.index !== undefined) {
                    handleElementSelect(data.index);
                  }
                }}
              />
              <YAxis 
                domain={[0, 1]} 
                tickCount={5} 
                tickFormatter={(value) => value.toFixed(1)}
                tick={{ fontSize: 14, fill: '#0e7490' }}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="probability" 
                fill="#06b6d4"
                animationDuration={isAnimating ? 0 : 300} // Disable default animation during our custom animation
                onClick={(data, index) => handleElementSelect(index)}
                style={{ cursor: isAnimating ? 'wait' : 'pointer' }}
                radius={[4, 4, 0, 0]}
                minPointSize={5} // Ensures even zero probability bars have some height
              >
                {distribution.map((entry, index) => (
                  <rect key={`rect-${index}`} fill={getBarColor(index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Element editor */}
        {selectedElement !== null && (
          <div className="p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-lg mb-4 transition-all shadow-inner border border-teal-100">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-cyan-800">
                Adjusting: {distribution[selectedElement].name}
              </span>
              <span className="text-teal-700 font-mono bg-white px-2 py-1 rounded-md shadow-sm border border-teal-100">
                {distribution[selectedElement].probability.toFixed(3)}
              </span>
            </div>
            
            <input 
              type="range" 
              min="0.01" 
              max="0.99" 
              step="0.01" 
              value={distribution[selectedElement].probability}
              onChange={handleSliderChange}
              className="w-full h-8 accent-teal-500"
              style={{
                '--range-thumb-bg': '#0d9488',
                '--range-track-bg': '#ccfbf1',
                '--range-track-active-bg': '#5eead4'
              }}
            />
            
            <div className="flex justify-between text-xs text-teal-600 mt-1">
              <span>Minimum</span>
              <span>Maximum</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Control buttons with pictographs */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4 border border-cyan-100">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-cyan-900">Distribution Presets</h2>
          {isAnimating && (
            <div className="text-sm text-teal-600 animate-pulse flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
              Animating...
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-4 max-[500px]:grid-cols-1">
          {/* Uniform preset */}
          <div 
            onClick={setUniform}
            className={`border border-cyan-300 rounded-lg overflow-hidden shadow-sm cursor-pointer hover:border-cyan-500 transition-all min-w-[140px] ${isAnimating ? 'opacity-70 pointer-events-none' : ''}`}
          >
            <div className="bg-cyan-600 text-white p-3 font-medium text-center">
              Uniform
            </div>
            <div className="bg-cyan-50 p-2 w-full flex justify-around items-end h-12">
              <div className="bg-cyan-500 w-3 h-6 rounded-t"></div>
              <div className="bg-cyan-500 w-3 h-6 rounded-t"></div>
              <div className="bg-cyan-500 w-3 h-6 rounded-t"></div>
              <div className="bg-cyan-500 w-3 h-6 rounded-t"></div>
            </div>
          </div>
          
          {/* Skewed preset */}
          <div 
            onClick={setSkewed}
            className={`border border-cyan-300 rounded-lg overflow-hidden shadow-sm cursor-pointer hover:border-cyan-500 transition-all min-w-[140px] ${isAnimating ? 'opacity-70 pointer-events-none' : ''}`}
          >
            <div className="bg-cyan-600 text-white p-3 font-medium text-center">
              Skewed
            </div>
            <div className="bg-cyan-50 p-2 w-full flex justify-around items-end h-12">
              <div className="bg-cyan-500 w-3 h-8 rounded-t"></div>
              <div className="bg-cyan-500 w-3 h-2 rounded-t"></div>
              <div className="bg-cyan-500 w-3 h-2 rounded-t"></div>
              <div className="bg-cyan-500 w-3 h-2 rounded-t"></div>
            </div>
          </div>
          
          {/* Zero entropy preset */}
          <div 
            onClick={setZeroEntropy}
            className={`border border-cyan-300 rounded-lg overflow-hidden shadow-sm cursor-pointer hover:border-cyan-500 transition-all min-w-[140px] ${isAnimating ? 'opacity-70 pointer-events-none' : ''}`}
          >
            <div className="bg-cyan-600 text-white p-3 font-medium text-center">
              Certainty
            </div>
            <div className="bg-cyan-50 p-2 w-full flex justify-around items-end h-12">
              <div className="bg-cyan-500 w-3 h-8 rounded-t"></div>
              <div className="bg-gray-300 w-3 h-1 rounded-t"></div>
              <div className="bg-gray-300 w-3 h-1 rounded-t"></div>
              <div className="bg-gray-300 w-3 h-1 rounded-t"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 max-[500px]:grid-cols-1 gap-2 mb-6">
        <button 
          onClick={addElement} 
          disabled={distribution.length >= (isMobile ? 5 : 8) || isAnimating}
          className="bg-emerald-600 text-white p-3 rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 font-medium transition shadow-sm border border-emerald-700 disabled:border-gray-400 min-w-[140px]"
        >
          + Add Element
        </button>
        <button 
          onClick={removeElement} 
          disabled={distribution.length <= 2 || isAnimating}
          className="bg-rose-600 text-white p-3 rounded-lg hover:bg-rose-700 disabled:bg-gray-300 font-medium transition shadow-sm border border-rose-700 disabled:border-gray-400 min-w-[140px]"
        >
          - Remove Element
        </button>
      </div>
      
      {/* Collapsible explanation */}
      <div className="bg-white p-4 rounded-lg shadow-md border border-cyan-100">
        <button 
          onClick={() => setIsInfoExpanded(!isInfoExpanded)}
          className="w-full flex justify-between items-center focus:outline-none"
        >
          <h2 className="text-lg font-semibold text-cyan-900">About Entropy</h2>
          <div className="text-cyan-700 transition-transform duration-300" style={{ transform: isInfoExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </button>
        
        <div className={`overflow-hidden transition-all duration-300 ${isInfoExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
          <p className="mb-2 text-cyan-900">
            Entropy measures uncertainty in a probability distribution. It's maximum when all outcomes are equally likely and zero when one outcome has 100% probability.
          </p>
          <p className="text-sm text-teal-600 bg-teal-50 p-2 rounded border border-teal-100">
            Formula: H(X) = -∑p(x) * log₂(p(x))
          </p>
        </div>
        
        {isAnimating && (
          <div className="mt-3 p-2 bg-cyan-50 rounded border border-cyan-100 text-sm">
            <div className="flex items-center text-cyan-700 mb-1">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              <span className="font-semibold">Animating transition: {Math.round(animationRef.current.progress * 100)}%</span>
            </div>
            <div className="w-full bg-cyan-100 rounded-full h-2 my-1">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-teal-300 h-2 rounded-full transition-none" 
                style={{ width: `${Math.round(animationRef.current.progress * 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-cyan-600">
              Watch how the entropy value changes smoothly as the probabilities transition to their new values.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntropyVisualization;