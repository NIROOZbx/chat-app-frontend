
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User } from 'lucide-react';

const Navbar = () => {
    const { user } = useAuth();
    const navs: string[] = ["Home", "Groups", "Relay", "Pricing", "About"];
    const [scrolled, setScrolled] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            setScrolled(scrollY > 50);

            if (location.pathname === '/') {
                if (scrollY < 600) setActiveIndex(0);      // Home
                else if (scrollY < 1200) setActiveIndex(1); // Groups
                else if (scrollY < 2200) setActiveIndex(2); // Relay
                else if (scrollY < 3000) setActiveIndex(3); // Pricing
                else setActiveIndex(4);                     // About
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [location.pathname]);

    const handleNavClick = (nav: string, index: number) => {
        if (nav === "Groups") {
            navigate('/rooms');
        } else if (nav === "Home") {
            if (location.pathname !== '/') {
                navigate('/');
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } else {
            if (location.pathname !== '/') {
                navigate('/');
                setTimeout(() => {
                    const scrollTargets: { [key: string]: number } = {
                        "Relay": 1700,
                        "Pricing": 2500,
                        "About": 3500
                    };
                    window.scrollTo({ top: scrollTargets[nav] || 0, behavior: 'smooth' });
                }, 100);
            }
        }
        setActiveIndex(index);
    };

    return (
        <nav className={`fixed left-0 w-full z-100 px-6 transition-all duration-300 ${scrolled ? 'py-4' : 'py-6'}`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Spacer / Logo Area */}
                <div className="flex-1">
                    {/* Add logo here if needed */}
                </div>

                {/* Main Navigation Pill */}
                <div className={`flex gap-4 sm:gap-8 md:gap-12 px-4 sm:px-10 py-3 rounded-full transition-all duration-300 overflow-x-auto no-scrollbar ${scrolled ? 'bg-black/40 backdrop-blur-md border border-white/10 shadow-lg' : 'bg-transparent border border-transparent'}`}>
                    {navs.map((nav, index) => {
                        const isRelay = nav === "Relay";
                        const isActive = (nav === "Groups" && location.pathname === '/rooms') ||
                            (nav === "Home" && location.pathname === '/' && activeIndex === 0) ||
                            (location.pathname === '/' && activeIndex === index);

                        return (
                            <div
                                key={index}
                                className={`
                                    cursor-pointer select-none uppercase transition-all duration-300 shrink-0
                                    ${isRelay
                                        ? "text-xl md:text-2xl font-bold tracking-wide text-white"
                                        : `text-[10px] md:text-sm font-light tracking-wide mt-1.5 ${isActive ? 'text-white font-normal' : 'text-white/70 hover:text-white'}`}
                                `}
                                onClick={() => handleNavClick(nav, index)}
                            >
                                {nav}
                            </div>
                        );
                    })}
                </div>

                {/* User Profile Section */}
                <div className="flex-1 flex justify-end min-w-0">
                    {user && (
                        <div className="flex items-center gap-2 sm:gap-4 cursor-pointer group">
                            <div className="hidden sm:flex flex-col items-end">
                                <p className="text-[10px] md:text-xs font-bold text-white tracking-tight uppercase leading-none">
                                    {user.UserName}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                    <p className="text-[8px] md:text-[10px] text-white/40 font-medium uppercase tracking-widest leading-none">
                                        Online
                                    </p>
                                </div>
                            </div>

                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center transition-transform group-hover:scale-105">
                                {user.ProfileImage ? (
                                    <img src={user.ProfileImage} alt={user.UserName} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={16} className="text-white/50" />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
