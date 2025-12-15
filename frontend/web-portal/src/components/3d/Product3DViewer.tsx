import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Html } from '@react-three/drei';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { PageTransition } from '../../animations';

interface Product3DViewerProps {
  onBack?: () => void;
}

interface ModelProps {
  url: string;
  scale?: number;
  position?: [number, number, number];
}

// Simple Cube Fallback Component
const SimpleCube = () => {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#3b82f6" />
    </mesh>
  );
};

// Error Boundary specifically for the 3D Model
class ModelErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Failed to load 3D model, defaulting to cube:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const Model: React.FC<ModelProps> = ({ url, scale = 1, position = [0, 0, 0] }) => {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={scale} position={position} />;
};

const Loading3D: React.FC = () => {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-blue-600 font-medium">Loading 3D Model...</p>
      </div>
    </Html>
  );
};

const WebGLFallback: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="text-center py-12">
      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        3D Viewer Not Available
      </h3>
      <p className="text-gray-500 mb-6">
        Your browser doesn't support WebGL.
      </p>
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <ArrowLeft size={18} />
        Back to Home
      </button>
    </div>
  );
};

const Product3DViewer: React.FC<Product3DViewerProps> = ({ onBack }) => {
  const { productName } = useParams<{ productName: string }>();
  const [webGLAvailable, setWebGLAvailable] = useState<boolean | null>(null);

  // Check WebGL support
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setWebGLAvailable(!!gl);
    } catch (error) {
      setWebGLAvailable(false);
    }
  }, []);

  const getModelUrl = () => {
    const name = productName?.toLowerCase();
    if (name === 'carebox') return '/models/carebox.glb';
    if (name === 'careband') return '/models/careband.glb';
    if (name === 'careapp') return '/models/careapp.glb';
    return '/models/product.glb';
  };

  const getModelConfig = () => {
    const name = productName?.toLowerCase();
    if (name === 'carebox') return { scale: 0.8, position: [0, -0.5, 0] as [number, number, number] };
    if (name === 'careband') return { scale: 1.2, position: [0, 0, 0] as [number, number, number] };
    if (name === 'careapp') return { scale: 1.0, position: [0, 0, 0] as [number, number, number] };
    return { scale: 1.0, position: [0, 0, 0] as [number, number, number] };
  };

  if (webGLAvailable === false) {
    return <WebGLFallback />;
  }

  if (webGLAvailable === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="relative">
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 mb-6">
          <div className="h-[60vh] w-full bg-gray-50 rounded-lg overflow-hidden">
            <Canvas
              camera={{ position: [0, 0, 5], fov: 50 }}
              onCreated={(state) => {
                state.gl.setPixelRatio(window.devicePixelRatio);
              }}
            >
              <ambientLight intensity={0.5} />
              <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
              <pointLight position={[-10, -10, -10]} intensity={0.5} />
              
              <Suspense fallback={<Loading3D />}>
                <ModelErrorBoundary fallback={<SimpleCube />}>
                  <Model
                    url={getModelUrl()}
                    scale={getModelConfig().scale}
                    position={getModelConfig().position}
                  />
                </ModelErrorBoundary>
                <Environment preset="city" />
              </Suspense>

              <OrbitControls
                target={[0, 0, 0]}
                enableZoom
                enablePan
                enableRotate
                minPolarAngle={0}
                maxPolarAngle={Math.PI}
                minDistance={2}
                maxDistance={10}
              />
            </Canvas>
          </div>  
        </div>
      </div>
    </PageTransition>
  );
};

export default Product3DViewer;
