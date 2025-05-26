import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface HeroItemProps {
  title: string;
  description: string;
  cta_url?: string;
  cta_text?: string;
  backgroundImage?: string;
}

interface HeroItem {
  type: 'heroesItem';
  props: HeroItemProps;
}

interface HeroesProps {
  background?: 'static' | 'dynamic';
  effect?: 'parallax' | 'none';
  backgroundImage?: string;
  automateSlider?: boolean;
  children?: HeroItem[];
  className?: string;
  style?: React.CSSProperties;
}

export function Heroes({
  background = 'static',
  effect = 'none',
  backgroundImage = '/hero-bg.jpg',
  automateSlider = true,
  children = [],
  className,
  style,
}: HeroesProps) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Filter out only heroesItem type children
  const heroItems = Array.isArray(children) ? children.filter(child => child?.type === 'heroesItem') : [];

  console.log('Filtered hero items:', heroItems);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0.6]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (automateSlider && heroItems.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroItems.length);
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(timer);
    }
  }, [automateSlider, heroItems.length]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    const newIndex = currentSlide + newDirection;
    if (newIndex >= 0 && newIndex < heroItems.length) {
      setCurrentSlide(newIndex);
    }
  };

  const currentHeroItem = heroItems[currentSlide];
  console.log('Current hero item:', currentHeroItem);

  return (
    <div
      ref={ref}
      className="relative w-full h-[70vh] overflow-hidden"
      style={{ position: 'relative' }}
    >
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              y: effect === 'parallax' ? backgroundY : 0,
              backgroundImage: `url(${currentHeroItem?.props?.backgroundImage || backgroundImage})`,
              opacity: effect === 'parallax' ? opacity : 1,
              position: 'absolute',
              ...style
            }}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          />
        )}
      </AnimatePresence>

      {/* Animated gradient overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60"
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-4">
        <AnimatePresence initial={false} custom={currentSlide}>
          <motion.div
            key={currentSlide}
            custom={currentSlide}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="absolute w-full flex flex-col items-center"
          >
            <div className="overflow-hidden">
              <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-wrap justify-center gap-x-4 mb-4"
              >
                {currentHeroItem?.props?.title?.split(' ').map((word, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.2 + index * 0.1,
                      ease: "easeOut"
                    }}
                    className="text-5xl md:text-6xl font-bold"
                  >
                    {word}
                  </motion.span>
                )) || <motion.span className="text-5xl md:text-6xl font-bold">Welcome</motion.span>}
              </motion.div>
            </div>

            <div className="overflow-hidden">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                className="text-xl md:text-2xl text-center max-w-2xl mb-8"
              >
                {currentHeroItem?.props?.description || 'No description available'}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {currentHeroItem?.props?.cta_url && (
                <Link
                  href={currentHeroItem.props.cta_url}
                  className="px-8 py-3 bg-white text-gray-900 rounded-full font-semibold hover:bg-opacity-90 transition-all duration-200"
                >
                  {currentHeroItem.props?.cta_text || 'Learn More'}
                </Link>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Slide indicators */}
        <div className="absolute bottom-12 flex gap-2">
          {heroItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/70'
                }`}
            />
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {heroItems.length > 1 && (
        <>
          <button
            onClick={() => paginate(-1)}
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 ${currentSlide === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={() => paginate(1)}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 ${currentSlide === heroItems.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            disabled={currentSlide === heroItems.length - 1}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}
    </div>
  );
} 