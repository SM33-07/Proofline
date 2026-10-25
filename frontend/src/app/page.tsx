'use client';

import React from 'react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingArchitecture } from '@/components/landing/LandingArchitecture';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function PublicLandingPage() {
  return (
    <div className="min-h-screen bg-[#F4F0E7] dark:bg-[#171815] text-[#242521] dark:text-[#F0E9DC] transition-colors">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingArchitecture />
      </main>
      <LandingFooter />
    </div>
  );
}
