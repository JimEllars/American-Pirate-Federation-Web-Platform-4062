import React from 'react';
import { Layout } from '../components/layout/Layout';
import { Hero } from '../components/sections/Hero';
import { Ticker } from '../components/sections/Ticker';
import { ThePirateCode } from '../components/sections/ThePirateCode';
import { TheTreasury } from '../components/sections/TheTreasury';
import { NewsFeed } from '../components/sections/NewsFeed';
import { MusterRoll } from '../components/sections/MusterRoll';
import { SEO } from '../components/seo/SEO';

export function Home() {
  return (
    <Layout>
      <SEO title="The New Paradigm" />
      <Hero />
      <Ticker />
      <ThePirateCode />
      <TheTreasury />
      <NewsFeed />
      <MusterRoll />
    </Layout>
  );
}