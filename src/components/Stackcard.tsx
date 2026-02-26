import CardSwap, { Card } from './CardSwap'
import { ArrowBigDown, ArrowBigRight, ArrowUpRight, Sparkles } from 'lucide-react';

const images = [
    "/chat5.jpg",
    "/chat4.png",
    "/chat3.jpeg",
    "/conn.jpg"
];

export default function Stackcard() {

    return (
        <section className="py-32  bg-black relative overflow-hidden">

            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left Column: Text */}
                    <div className="text-left animate-fade-in-up">

                        <h2 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-linear-to-b from-white to-white/60 mb-6 font-clash leading-tight">
                            Conversations That <br /> Move at the Speed of <span className="text-gray-300">Thought</span>.
                        </h2>

                        <p className="text-white/60 max-w-xl text-lg leading-relaxed mb-8">
                            Connect instantly across the globe with a platform designed for real-time clarity.
                            Seamless messaging, intelligent organization, and a system built to keep you in sync
                            with what matters most.
                        </p>


                        <button className="pl-4 pr-1 py-1 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors flex items-center gap-3">
                            Join Now

                            <span className="bg-black text-white rounded-full p-2 flex items-center justify-center">
                                <ArrowUpRight size={20} />
                            </span>

                        </button>

                    </div>

                    {/* Right Column: Cards */}
                    <div style={{ height: '600px', position: 'relative' }} className="w-full flex items-center justify-center">
                        <CardSwap
                            cardDistance={50}
                            verticalDistance={60}
                            delay={1500}
                            pauseOnHover={false}
                            width="100%"
                            height="550px" // Adjusted height
                        >
                            {images.map((src, index) => (
                                <Card key={index} customClass="w-[90%] md:w-[600px] h-[400px]">
                                    <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-black/40 backdrop-blur-md relative group transition-all duration-300 hover:border-blue-500/30">
                                        <div className="absolute inset-0 bg-linear-to-b from-white/5 to-transparent opacity-50 pointer-events-none"></div>
                                        <img
                                            src={src}
                                            alt={`Chat Interface ${index + 1}`}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                    </div>
                                </Card>
                            ))}
                        </CardSwap>
                    </div>
                </div>
            </div>

        </section>
    );
}