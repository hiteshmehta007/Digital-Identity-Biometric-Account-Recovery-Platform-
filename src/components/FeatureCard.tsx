import { ReactNode } from 'react';
import { Card, CardContent } from './ui/card';
import { motion } from 'motion/react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  index: number;
}

export function FeatureCard({ icon, title, description, index }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
    >
      <Card className="border-gray-200 hover:border-teal-300 transition-all hover:shadow-2xl bg-white h-full group">
        <CardContent className="pt-6 pb-6 px-6 flex flex-col items-center text-center gap-4">
          <motion.div 
            className="h-16 w-16 rounded-full bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center text-teal-700 group-hover:shadow-lg transition-shadow"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {icon}
          </motion.div>
          <div>
            {title}
          </div>
          <p className="text-gray-600">
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
