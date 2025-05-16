"use client";

import { useTheme } from 'next-themes';
import MyActivities from '../../components/MyActivities';

export default function ActivitiesPage() {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';

  return (
    <main className="min-h-screen">
      <MyActivities darkMode={darkMode} />
    </main>
  );
}