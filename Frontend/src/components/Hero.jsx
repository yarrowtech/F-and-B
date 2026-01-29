import React from 'react';
import tableImage from '../assets/Images/resturent.jpg';

const Hero = () => {
  return (
    <section
      id="hero"
      className="relative w-full h-screen flex items-center justify-center pt-20"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${tableImage})`,
          filter: 'brightness(65%)',
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent"></div>

      {/* Text Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-wide font-serif italic drop-shadow-lg">
          <span className="text-green-300">Streamline</span>{' '}
          <span className="text-yellow-300">Your</span>{' '}
          <span className="text-pink-300">Restaurant</span>{' '}
          <span className="text-blue-300">Operations</span>
        </h1>
        <p className="text-lg md:text-xl mb-10 font-medium tracking-normal drop-shadow-md text-green-200">
          <span className="text-green-200">Smart ERP solution</span>{' '}
          <span className="text-yellow-200">tailored for</span>{' '}
          <span className="text-pink-200">Food & Beverage</span>{' '}
          <span className="text-blue-200">excellence</span>.{' '}
          <span className="text-emerald-200">Automate tasks</span>,{' '}
          <span className="text-lime-200">manage teams</span>, and{' '}
          <span className="text-cyan-200">gain insights</span> — all in one platform.
        </p>
      </div>
    </section>
  );
};

export default Hero;
