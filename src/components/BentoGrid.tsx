import { MessageSquare, Shield, Zap, Globe, Users, ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import ElectricBorder from './ElectricBorder';

const BentoGrid = () => {
    return (
        <section className="py-24 relative z-10 w-full">
            <div className="container mx-auto px-4">
                <div className="mb-16 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-b from-white to-white/60 mb-6 font-clash">
                        Everything you need to connect.
                    </h2>
                    <p className="text-white/60 max-w-2xl mx-auto text-lg">
                        Built for modern teams who demand speed, security, and flexibility.
                        Experience the future of communication.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 auto-rows-[180px]">

                    {/* Feature 1: Large - Messaging */}
                    <BentoCard
                        className="md:col-span-2 md:row-span-2 bg-linear-to-br from-blue-900/20 to-transparent"
                        title="Real-time Messaging"
                        description="Instant message delivery with WebSocket technology. Never miss a beat."
                        icon={<MessageSquare className="w-8 h-8 text-blue-400" />}
                        color="#60a5fa"
                    />

                    <BentoCard
                        className="md:col-span-1 md:row-span-2 bg-linear-to-br from-orange-900/20 to-transparent justify-end"
                        title="Community Groups"
                        description="Build thriving communities with powerful moderation tools."
                        icon={<Users className="w-8 h-8 text-orange-400" />}
                        color="#fb923c"
                    />

                    {/* Feature 2: Security */}
                    <BentoCard
                        className="md:col-span-1 md:row-span-1 bg-linear-to-br from-purple-900/20 to-transparent"
                        title="End-to-End Encryption"
                        description="Your conversations are private and secure."
                        icon={<Shield className="w-6 h-6 text-purple-400" />}
                        color="#c084fc"
                    />

                    {/* Feature 3: Speed */}
                    <BentoCard
                        className="md:col-span-1 md:row-span-1 bg-linear-to-br from-yellow-900/20 to-transparent"
                        title="Lightning Fast"
                        description="Optimized for low latency."
                        icon={<Zap className="w-6 h-6 text-yellow-400" />}
                        color="#facc15"
                    />

                    {/* Feature 4: Global (Wide) */}
                    <BentoCard
                        className="md:col-span-2 md:row-span-1 bg-linear-to-br from-green-900/20 to-transparent"
                        title="Global Connectivity"
                        description="Connect with anyone, anywhere in the world. No barriers."
                        icon={<Globe className="w-6 h-6 text-green-400" />}
                        color="#4ade80"
                    />

                    {/* Feature 5: Groups (Tall) */}


                    {/* CTA Card */}
                    {/* <ElectricBorder className="md:col-span-1 md:row-span-1 rounded-3xl group cursor-pointer" color="#ffffff">
                        <div className="h-full w-full border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:bg-white/10 transition-colors flex items-center justify-center relative overflow-hidden rounded-3xl">
                            <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex items-center gap-2 text-white font-bold text-xl z-10">
                                Start Now <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </div>
                        </div>
                    </ElectricBorder> */}

                </div>
            </div>
        </section>
    );
};

interface BentoCardProps {
    className?: string;
    title: string;
    description: string;
    icon: ReactNode;
    color?: string;
    delay?: number;
}

const BentoCard = ({ className = "", title, description, icon, color = "#5227FF", delay = 0 }: BentoCardProps) => {
    return (
        <motion.div
            className={`rounded-3xl ${className}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
        >
            <ElectricBorder color={color} className="h-full w-full">
                <div className={`h-full w-full border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:border-white/20 transition-all group flex flex-col justify-between overflow-hidden relative rounded-3xl`}>
                    <div className="absolute inset-0 bg-linear-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    <div className="mb-4 z-10 p-2 rounded-full bg-white/5 w-fit border border-white/5 backdrop-blur-md">
                        {icon}
                    </div>
                    <div className="z-10">
                        <h3 className="text-xl font-bold text-white mb-2 font-clash">{title}</h3>
                        <p className="text-white/60 text-sm leading-relaxed">{description}</p>
                    </div>
                </div>
            </ElectricBorder>
        </motion.div>
    );
};

export default BentoGrid;
