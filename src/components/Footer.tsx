import { Github, Twitter, Linkedin, Instagram } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="relative z-10 w-full bg-black py-12 border-t border-white/10">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">

                    {/* Brand Column */}
                    <div className="md:col-span-1">
                        <h3 className="text-2xl font-bold text-white mb-4 font-clash">Relay</h3>
                        <p className="text-white/60 mb-6">
                            Connect with the world. Fast, secure, and beautiful.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-white/60 hover:text-white transition-colors">
                                <Github size={20} />
                            </a>
                            <a href="#" className="text-white/60 hover:text-blue-400 transition-colors">
                                <Twitter size={20} />
                            </a>
                            <a href="#" className="text-white/60 hover:text-blue-600 transition-colors">
                                <Linkedin size={20} />
                            </a>
                            <a href="#" className="text-white/60 hover:text-pink-500 transition-colors">
                                <Instagram size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Links Column 1 */}
                    <div>
                        <h4 className="text-lg font-bold text-white mb-4">Product</h4>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-white/60 hover:text-white transition-colors">Features</a></li>
                            <li><a href="#" className="text-white/60 hover:text-white transition-colors">Integrations</a></li>
                            <li><a href="#" className="text-white/60 hover:text-white transition-colors">Pricing</a></li>
                            <li><a href="#" className="text-white/60 hover:text-white transition-colors">Changelog</a></li>
                        </ul>
                    </div>

                    {/* Links Column 2 */}
                    <div>
                        <h4 className="text-lg font-bold text-white mb-4">Resources</h4>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-white/60 hover:text-white transition-colors">Documentation</a></li>
                            <li><a href="#" className="text-white/60 hover:text-white transition-colors">API Reference</a></li>
                            <li><a href="#" className="text-white/60 hover:text-white transition-colors">Community</a></li>
                            <li><a href="#" className="text-white/60 hover:text-white transition-colors">Blog</a></li>
                        </ul>
                    </div>

                    {/* Links Column 3 */}
                    <div>
                        <h4 className="text-lg font-bold text-white mb-4">Company</h4>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-white/60 hover:text-white transition-colors">About</a></li>
                            <li><a href="#" className="text-white/60 hover:text-white transition-colors">Careers</a></li>
                            <li><a href="#" className="text-white/60 hover:text-white transition-colors">Legal</a></li>
                            <li><a href="#" className="text-white/60 hover:text-white transition-colors">Contact</a></li>
                        </ul>
                    </div>

                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-white/40 text-sm">
                        © {new Date().getFullYear()} ChatApp. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">Privacy Policy</a>
                        <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
