import { useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);



export const useScrollStack = (
    triggerRef: React.RefObject<HTMLDivElement | null>,
    containerRef: React.RefObject<HTMLDivElement | null>,
    itemsRef: React.RefObject<(HTMLDivElement | null)[]>
) => {
    useLayoutEffect(() => {
        if (!triggerRef.current || !containerRef.current || !itemsRef.current.length) return;

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

            // Set initial states (except first card)
            itemsRef.current.forEach((card, index) => {
                if (index === 0 || !card) return;
                gsap.set(card, {
                    y: 100,
                    opacity: 0,
                    scale: 0.9,
                    rotateX: -10
                });
            });

            // Animate cards
            itemsRef.current.forEach((_, index) => {
                if (index === 0) return;
                const card = itemsRef.current[index];
                const prevCard = itemsRef.current[index - 1];

                if (card) {
                    tl.to(card, {
                        y: index * 15,
                        opacity: 1,
                        scale: 1,
                        rotateX: 0,
                        duration: 1,
                        ease: "power2.out"
                    }, index * 0.8);
                }

                if (prevCard) {
                    tl.to(prevCard, {
                        scale: 0.95 - (index * 0.02),
                        opacity: 0.5,
                        y: -20,
                        duration: 1
                    }, index * 0.8);
                }
            });

        }, triggerRef);

        return () => ctx.revert();
    }, [triggerRef, containerRef, itemsRef]);
};
