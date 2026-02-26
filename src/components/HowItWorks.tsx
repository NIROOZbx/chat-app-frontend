import { useRef, useLayoutEffect } from 'react';
import { UserPlus, MessageCircle, Users } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const steps = [
    {
        icon: <UserPlus className="w-8 h-8 text-gray-400" />,
        title: "Choose a Name",
        description: "Pick a username. No email or signup needed.",
        color: "from-gray-500/20 to-gray-600/20",
        border: "border-gray-500/30"
    },
    {
        icon: <Users className="w-8 h-8 text-purple-400" />,
        title: "Join a Room",
        description: "Find your community or create a new space instantly.",
        color: "from-purple-500/20 to-purple-600/20",
        border: "border-purple-500/30"
    },
    {
        icon: <MessageCircle className="w-8 h-8 text-orange-400" />,
        title: "Start Chatting",
        description: "Connect instantly with real-time messaging.",
        color: "from-orange-500/20 to-orange-600/20",
        border: "border-orange-500/30"
    }
];

const HowItWorks = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
    const lineRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: triggerRef.current,
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 1,
                    pin: containerRef.current,
                    pinSpacing: true,
                }
            });

            // Initial State: All cards stacked in the center
            cardsRef.current.forEach((card) => {
                if (card) {
                    gsap.set(card, {
                        y: 0,
                        opacity: 0,
                        scale: 0.8,
                        zIndex: 0
                    });
                }
            });

            // Set first card visible initially
            if (cardsRef.current[0]) {
                gsap.set(cardsRef.current[0], { opacity: 1, scale: 1, zIndex: 10 });
            }

            // Animate Spread
            // Card 1 moves up, Card 3 moves down, Card 2 stays (or custom spacing)

            // Step 1: Reveal all cards slightly stacked
            tl.to(cardsRef.current, {
                opacity: 1,
                scale: 1,
                duration: 1,
                stagger: 0.1
            });

            // Step 2: Spread them out vertically
            tl.to(cardsRef.current[0], { y: -150, zIndex: 3 }, "<");
            tl.to(cardsRef.current[1], { y: 0, zIndex: 2 }, "<");
            tl.to(cardsRef.current[2], { y: 150, zIndex: 1 }, "<");

            // Step 3: Grow the connecting line
            tl.fromTo(lineRef.current,
                { height: 0, opacity: 0 },
                { height: '300px', opacity: 1, duration: 1 },
                "<0.5"
            );

        }, triggerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={triggerRef} className="relative w-full bg-black">
            <div className="h-[250vh]">
                <div ref={containerRef} className="h-screen sticky top-0 flex flex-col items-center justify-center overflow-hidden">

                    <div className="container mx-auto px-4 mb-24 text-center relative z-20">
                        <h2 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-linear-to-b from-white to-white/60 mb-6 font-clash">
                            How OnlyChat Works
                        </h2>
                        <p className="text-white/60 max-w-2xl mx-auto text-lg">
                            Your Journey to Seamless Communication
                        </p>
                    </div>

                    <div className="relative w-full max-w-4xl h-[500px] flex items-center justify-center">

                        {/* Connecting Line */}
                        <div
                            ref={lineRef}
                            className="absolute w-1 bg-linear-to-b from-gray-500 via-gray-500 to-gray-500 rounded-full"
                            style={{ height: 0, left: '50%', transform: 'translateX(-50%)', top: '50%', marginTop: '-150px' }}
                        ></div>

                        {steps.map((step, index) => (
                            <div
                                key={index}
                                ref={(el) => { cardsRef.current[index] = el; }}
                                className="absolute left-0 right-0 w-full flex justify-center items-center"
                                style={{ zIndex: steps.length - index }}
                            >
                                <div className={`
                                    w-[400px] h-[100px] p-4 rounded-xl 
                                    border ${step.border} bg-white
                                    shadow-xl flex flex-row items-center gap-4
                                    relative z-10
                                `}>
                                    {/* Number Background (Subtle) */}
                                  

                                    {/* Icon Box */}
                                    <div className={`
                                        relative w-12 h-12 shrink-0 rounded-lg 
                                        bg-linear-to-br ${step.color} 
                                        flex items-center justify-center
                                        border border-white/10 z-10
                                    `}>
                                        <div className="relative z-10 transform scale-90">
                                            {step.icon}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="text-left relative z-10 w-full pr-8">
                                        <h3 className="text-lg font-bold text-gray-900 mb-1 font-clash leading-tight">
                                            {step.title}
                                        </h3>
                                        <p className="text-gray-500 text-xs leading-snug line-clamp-2">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
