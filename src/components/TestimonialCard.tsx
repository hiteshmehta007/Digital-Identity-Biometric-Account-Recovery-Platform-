import { Card, CardContent } from './ui/card';
import { Quote } from 'lucide-react';
import { motion } from 'motion/react';

interface TestimonialCardProps {
  quote: string;
  author: string;
  index: number;
}

export function TestimonialCard({ quote, author, index }: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <Card className="border-gray-200 bg-white hover:shadow-xl transition-shadow h-full">
        <CardContent className="pt-6 pb-6 px-6">
          <motion.div
            initial={{ rotate: 0 }}
            whileHover={{ rotate: 12 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Quote className="text-teal-300 mb-4" size={32} />
          </motion.div>
          <p className="text-gray-700 mb-4 italic">
            "{quote}"
          </p>
          <p className="text-gray-500">
            — {author}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
