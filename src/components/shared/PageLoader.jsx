import React from 'react';
import { Loader } from 'lucide-react';

const PageLoader = () => (
  <div className="flex items-center justify-center w-full h-full min-h-[50vh] text-accent">
    <Loader className="w-10 h-10 animate-spin" aria-label="Loading content" />
  </div>
);

export default PageLoader;
