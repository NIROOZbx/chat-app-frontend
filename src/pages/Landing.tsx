
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import BentoGrid from '../components/BentoGrid'
import HowItWorks from '../components/HowItWorks'
import CTA from '../components/CTA'
import Stackcard from '../components/Stackcard'
import Footer from '../components/Footer'

function Landing() {
    return (
        <div className="relative min-h-screen w-full bg-black overflow-x-hidden">
            <Navbar />
            <Hero />
            <BentoGrid />
            <HowItWorks />
            <Stackcard />
            <CTA />
            <Footer />
        </div>
    )
}

export default Landing
