import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface CompartmentSelectorProps {
  totalCompartments?: number;
  selectedCompartments: number[];
  usedCompartments: number[];
  onSelect: (compartment: number) => void;
  onDeselect: (compartment: number) => void;
  size?: number;
  showLabels?: boolean;
}

const CompartmentSelector: React.FC<CompartmentSelectorProps> = ({
  totalCompartments = 12,
  selectedCompartments = [],
  usedCompartments = [],
  onSelect,
  onDeselect,
  size = 300,
  showLabels = true
}) => {
  const [error, setError] = useState<string | null>(null);
  const radius = size / 2;
  const center = size / 2;

  // Calculate positions for compartments
  const calculatePositions = () => {
    const positions = [];
    const angleStep = (2 * Math.PI) / totalCompartments;

    for (let i = 0; i < totalCompartments; i++) {
      const angle = i * angleStep;
      const x = center + radius * 0.8 * Math.cos(angle);
      const y = center + radius * 0.8 * Math.sin(angle);

      positions.push({
        index: i + 1, // Compartments are 1-based
        x,
        y,
        angle
      });
    }

    return positions;
  };

  const positions = calculatePositions();

  const handleCompartmentClick = (compartment: number) => {
    // Check if compartment is already used
    if (usedCompartments.includes(compartment)) {
      setError(`Compartment ${compartment} is already in use`);
      return;
    }

    // Clear any previous errors
    setError(null);

    // Check if compartment is already selected
    if (selectedCompartments.includes(compartment)) {
      onDeselect(compartment);
    } else {
      onSelect(compartment);
    }
  };

  // Calculate the current lowest available compartment
  const getLowestAvailableCompartment = () => {
    const allCompartments = Array.from({ length: totalCompartments }, (_, i) => i + 1);
    const available = allCompartments.filter(c => 
      !usedCompartments.includes(c) && !selectedCompartments.includes(c)
    );
    
    return available.length > 0 ? Math.min(...available) : null;
  };

  const lowestAvailable = getLowestAvailableCompartment();

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Circular base */}
      <div className="absolute inset-0 rounded-full border-2 border-gray-200" />

      {/* Compartment items */}
      {positions.map((pos) => {
        const isUsed = usedCompartments.includes(pos.index);
        const isSelected = selectedCompartments.includes(pos.index);
        const isLowestAvailable = pos.index === lowestAvailable;

        return (
          <motion.div
            key={pos.index}
            className="absolute flex items-center justify-center cursor-pointer transition-all"
            style={{
              width: size * 0.15,
              height: size * 0.15,
              left: pos.x - (size * 0.075),
              top: pos.y - (size * 0.075),
              borderRadius: '50%'
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCompartmentClick(pos.index)}
          >
            {/* Compartment circle */}
            <div className="w-full h-full rounded-full flex items-center justify-center relative"
                 style={{
                   backgroundColor: isUsed ? '#f3f4f6' : isSelected ? '#3b82f6' : 'white',
                   border: isLowestAvailable && !isSelected && !isUsed ? '2px solid #10b981' : 'none',
                   boxShadow: isLowestAvailable && !isSelected && !isUsed ? '0 0 0 2px #10b981' : 'none'
                 }}>
              {/* Compartment number */}
              <span className="font-medium text-sm"
                    style={{
                      color: isUsed ? '#9ca3af' : isSelected ? 'white' : '#374151'
                    }}>
                {pos.index}
              </span>

              {/* Used indicator (lock icon) */}
              {isUsed && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Error message */}
      {error && (
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <div className="text-red-500 text-sm font-medium p-2 bg-red-50 rounded">
            {error}
          </div>
        </div>
      )}

      {/* Lowest available indicator */}
      {lowestAvailable && showLabels && (
        <div className="absolute -bottom-12 left-0 right-0 text-center">
          <div className="text-green-600 text-sm font-medium">
            Next available: Compartment {lowestAvailable}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompartmentSelector;