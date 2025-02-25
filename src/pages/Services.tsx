import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Wind, Droplets } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Services() {
  const location = useLocation();
  const isBookingPage = location.pathname === '/booking';

  const services = [
    {
      id: 'lying-1',
      icon: <Sun className="h-12 w-12" />,
      title: "Gulimas Soliariumas",
      description: "Modernus gulimas soliariumas su pažangia vėdinimo sistema ir komfortiška temperatūra.",
      features: [
        "42 UV lempos",
        "Vėdinimo sistema",
        "Aromaterapija",
        "Muzikos sistema"
      ],
      price: "0.70€/min"
    },
    {
      id: 'standing-1',
      icon: <Wind className="h-12 w-12" />,
      title: "Stovimas Soliariumas",
      description: "Vertikalus soliariumas su purškimo funkcija ir gaiviu vėdinimu.",
      features: [
        "48 UV lempos",
        "Purškimo sistema",
        "Vėdinimo sistema",
        "LED apšvietimas"
      ],
      price: "0.70€/min"
    },
    {
      id: 'cosmetics',
      icon: <Droplets className="h-12 w-12" />,
      title: "Premium Kosmetika",
      description: "Aukščiausios kokybės įdegio kosmetika jūsų odai.",
      features: [
        "Drėkinamieji kremai",
        "Aktyvatoriai",
        "Fiksatoriai",
        "Apsauginiai kremai"
      ],
      price: "Nuo 5€"
    }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="bg-elida-peach py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="font-playfair text-4xl md:text-5xl text-gray-900 mb-6">
              Mūsų Paslaugos
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Atraskite aukščiausios kokybės įdegio paslaugas su modernia įranga ir profesionaliu aptarnavimu
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300"
              >
                <div className="p-8">
                  <div className="w-16 h-16 bg-elida-cream rounded-xl flex items-center justify-center text-elida-gold mb-6 group-hover:bg-elida-gold group-hover:text-white transition-all duration-300">
                    {service.icon}
                  </div>
                  <h3 className="font-playfair text-2xl text-gray-900 mb-4">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {service.description}
                  </p>
                  <ul className="space-y-3 mb-6">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-gray-600">
                        <span className="w-1.5 h-1.5 bg-elida-gold rounded-full mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-playfair text-elida-gold">
                      {service.price}
                    </span>
                    {service.id !== 'cosmetics' && (
                      <Link
                        to="/booking"
                        className="px-6 py-2 bg-elida-gold text-white rounded-full text-sm font-medium hover:bg-elida-accent transition-colors duration-300"
                      >
                        Rezervuoti
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}