import { useState, type FormEvent } from 'react';
import { ArrowRightCircle, Search } from 'lucide-react';
import LightPillar from './LightPillar';
import GradientText from './GradientText';
import AuthModal from './AuthModal';

const Hero = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        console.log('Searching for:', searchQuery);
        setSearchQuery("")
        // Implement actual search logic here
    };

    return (
        <div className="relative h-screen w-full overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105"
                style={{ backgroundImage: "url('hero.png')" }}
            ></div>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-linear-to-b from-black/10 via-black/10 to-black/80"></div>
            {/* Content */}
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center text-white">
                <div className="animate-fade-in-up">
                    <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-6xl text-center">
                        <GradientText
                            colors={["#f8f1f8", "#978f8c", "#eddede"]}
                            animationSpeed={2.5}
                            showBorder={false}
                            className="font-bold pb-1"
                        >
                            Stay Connected. Anytime. Anywhere.
                        </GradientText>
                    </h1>
                    <p className="mb-8 max-w-2xl mx-auto text-md text-white/80 md:text-lg leading-relaxed">
                        Experience seamless communication with our high-performance distributed chat platform.
                        Real-time, secure, and built for scale.
                    </p>

                    <div className="flex flex-col gap-4 sm:flex-row justify-center items-center">
                        <button
                            className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20 cursor-pointer"
                            onClick={() => setIsAuthModalOpen(true)}
                        >
                            Get started
                            <ArrowRightCircle size={22} />
                        </button>

                        <form onSubmit={handleSearch} className="relative group flex items-center w-full sm:w-auto">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for groups..."
                                className="w-full sm:w-80  rounded-full border border-white/10 bg-white/5 pl-6 pr-6 py-2.5 text-sm text-white placeholder-white/50 backdrop-blur-md transition-all focus:bg-white/10 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/50 hover:bg-white/10"
                            />
                            <button
                                type="submit"
                                disabled={!searchQuery.trim()}
                                className="border border-white/10 absolute right-1 top-1 bottom-1 aspect-square rounded-full bg-white/10 flex items-center justify-center text-white transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                aria-label="Search"
                            >
                                <Search className="h-4 w-4" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden mix-blend-screen opacity-80">
                <LightPillar
                    topColor="#edebf4"
                    bottomColor="#fcaa1d"
                    intensity={0.6}
                    rotationSpeed={0.8}
                    glowAmount={0.001}
                    pillarWidth={1}
                    pillarHeight={0.4}
                    noiseIntensity={0.1}
                    pillarRotation={65}
                    interactive={false}
                    mixBlendMode="screen"
                    quality="high"
                />
            </div>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />

        </div>
    );
};

export default Hero;
