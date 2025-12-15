"use client";

import { motion, type Variants } from 'framer-motion';
import React from 'react';

// Animation Variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const slideIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

const slideInRight = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const bounceIn = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 10,
      stiffness: 200,
    },
  },
};

const cardHover: Variants = {
  rest: {
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
};

const buttonClick = {
  rest: {
    scale: 1,
  },
  press: {
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },
};

// Transition Presets
const transitionFast = {
  duration: 0.2,
  ease: 'easeOut',
};

const transitionNormal = {
  duration: 0.3,
  ease: 'easeOut',
};

const transitionSlow = {
  duration: 0.5,
  ease: 'easeOut',
};

const springTransition = {
  type: 'spring',
  damping: 10,
  stiffness: 100,
};

// Animated Components
const AnimatedDiv = motion.div;
const AnimatedButton = motion.button;
const AnimatedSpan = motion.span;
const AnimatedSection = motion.section;

// Page Transition Component
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

// Staggered Animation Container
const StaggeredContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
};

// Hoverable Card Component
const HoverableCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      variants={cardHover}
      initial="rest"
      whileHover="hover"
    >
      {children}
    </motion.div>
  );
};

// Clickable Button Component
const ClickableButton = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => {
  return (
    <motion.button
      variants={buttonClick}
      initial="rest"
      whileTap="press"
      onClick={onClick}
      className="px-4 py-2 bg-primary text-white rounded-lg transition-all"
    >
      {children}
    </motion.button>
  );
};

// Loading Animation
const LoadingDots = () => {
  return (
    <div className="flex space-x-1">
      <motion.div
        className="w-2 h-2 bg-primary rounded-full"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.6, repeat: Infinity }}
      />
      <motion.div
        className="w-2 h-2 bg-primary rounded-full"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
      />
      <motion.div
        className="w-2 h-2 bg-primary rounded-full"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
      />
    </div>
  );
};

// Typewriter Effect
const TypewriterText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = React.useState('');
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[index]);
        setIndex(prev => prev + 1);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [index, text]);

  return <span>{displayedText}</span>;
};

// Gradient Background Animation
const GradientBackground = () => {
  return (
    <motion.div
      className="fixed inset-0 -z-10"
      animate={{
        background: [
          'linear-gradient(45deg, #14b8a6, #06b6d4)',
          'linear-gradient(45deg, #06b6d4, #14b8a6)',
          'linear-gradient(45deg, #14b8a6, #06b6d4)',
        ],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
};

// Export all animations
export {
  motion,
  fadeIn,
  slideIn,
  slideInLeft,
  slideInRight,
  scaleIn,
  staggerContainer,
  staggerItem,
  bounceIn,
  cardHover,
  buttonClick,
  transitionFast,
  transitionNormal,
  transitionSlow,
  springTransition,
  AnimatedDiv,
  AnimatedButton,
  AnimatedSpan,
  AnimatedSection,
  PageTransition,
  StaggeredContainer,
  HoverableCard,
  ClickableButton,
  LoadingDots,
  TypewriterText,
  GradientBackground,
};