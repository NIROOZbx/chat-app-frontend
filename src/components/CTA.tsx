import { ArrowRight } from 'lucide-react';

const CTA = () => {
    return (
        <section className="py-32 mt-32 relative z-10 w-full overflow-hidden bg-black">
            <div className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none" style={{ backgroundImage: "url('/earth1.jpg')" }}></div>
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-white/5 to-transparent pointer-events-none"></div>

            <div className="container mx-auto px-4 relative z-10 text-center">
                <div className="animate-fade-in-scale max-w-4xl mx-auto">

                    <h2 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-linear-to-b from-white via-white to-white/40 mb-8 font-clash leading-tight">
                        Ready to change how you connect?
                    </h2>

                    <p className="text-white/60 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                        Experience the next generation of messaging. Secure, fast, and beautifully designed for teams like yours.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="group relative px-8 py-4 bg-white text-black font-bold rounded-full text-lg transition-colors flex items-center gap-2 overflow-hidden cursor-pointer">
                            <span className="relative z-10 text-black group-hover:text-black transition-colors">Get Started Now</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10 text-black group-hover:text-black" />

                            {/* Metallic Flow Background */}
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity animate-liquid z-0"
                                style={{
                                    backgroundImage: 'linear-gradient(to right, #ffffff, #d1d5db, #ffffff)',
                                    backgroundSize: '200% 100%'
                                }}
                            ></div>

                            {/* Shine overlay (optional, maybe remove if too much) */}
                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] z-10 pointer-events-none"></div>
                        </button>


                    </div>
                </div>
            </div>

            {/* Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 blur-[100px] rounded-full pointer-events-none"></div>
        </section>
    );
};

export default CTA;
