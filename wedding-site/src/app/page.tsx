"use client";

import React from "react";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Cormorant_Garamond,
  Dancing_Script,
  Playfair_Display,
} from "next/font/google";
import {
  AnimatePresence,
  motion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const WEDDING_DATE = new Date("2026-12-12T11:00:00+02:00").getTime();
const RSVP_DEADLINE = "30 September 2026";

type GuestGroup = "bride-groom" | "parents";

type FamilyMember = {
  id: string;
  fullName: string;
  attendingWedding: boolean;
  attendingChurch: boolean;
  churchEligible: boolean;
  contactEmail: string;
  contactPhone: string;
  unableToAttend: boolean;
};

type RSVPFamily = {
  id: string;
  surname: string;
  familyNameKey: string;
  guestGroup: GuestGroup;
  churchSeatLimit: number;
  churchSeatsUsed: number;
  contactEmail?: string;
  contactPhone?: string;
  rsvpStatus: string;
};

type RSVPStep = "surname" | "loading" | "family" | "success";

type SuggestedFamily = {
  id: string;
  surname: string;
  guestGroup: GuestGroup;
  membersPreview: string[];
};

const PHOTO_FILENAMES = [
  "WhatsApp Image 2026-06-20 at 20.15.351.JPG",
  "WhatsApp Image 2026-06-07 at 09.10.22.jpeg",
  "WhatsApp Image 2026-06-07 at 09.10.23.jpeg",
  "WhatsApp Image 2026-06-07 at 09.09.52.jpeg",
  "WhatsApp Image 2026-06-07 at 09.10.13.jpeg",
  "WhatsApp Image 2026-06-07 at 09.10.21 (1).jpeg",
  "WhatsApp Image 2026-06-07 at 09.10.21.jpeg",
  "WhatsApp Image 2026-06-07 at 09.10.22 (1).jpeg",
  "WhatsApp Image 2026-06-07 at 09.10.22 (2).jpeg",
  "WhatsApp Image 2026-06-20 at 19.40.53 (1).jpeg",
  "WhatsApp Image 2026-06-20 at 19.52.41.jpeg",
  "WhatsApp Image 2026-06-20 at 20.14.38.jpeg",
  "WhatsApp Image 2026-06-20 at 20.21.21 (1).JPG",
  "WhatsApp Image 2026-06-20 at 20.30.26.JPG",
];

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const CAROUSEL_IMAGES = PHOTO_FILENAMES.map(
  (name) => `${BASE_PATH}/${encodeURIComponent(name)}`
);

const POLAROID_IMAGES = CAROUSEL_IMAGES.slice(0, 4);

function normalizeSurname(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getTimeLeft() {
  const difference = WEDDING_DATE - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  function fadeTo(audio: HTMLAudioElement, targetVolume: number) {
    const step = targetVolume > audio.volume ? 0.01 : -0.01;

    const interval = window.setInterval(() => {
      const nextVolume = audio.volume + step;

      if (
        (step > 0 && nextVolume >= targetVolume) ||
        (step < 0 && nextVolume <= targetVolume)
      ) {
        audio.volume = targetVolume;
        window.clearInterval(interval);
        return;
      }

      audio.volume = Math.max(0, Math.min(0.25, nextVolume));
    }, 70);
  }

  async function startMusic() {
    const audio = audioRef.current;

    if (!audio || started) return;

    try {
      // Try to unmute and fade in on first user gesture.
      audio.muted = false;
      audio.volume = 0;
      await audio.play();
      fadeTo(audio, 0.25);
      setStarted(true);
      setIsPlaying(true);
    } catch (error) {
      console.log("Audio could not start yet:", error);
    }
  }

  async function toggleMusic() {
    const audio = audioRef.current;

    if (!audio) return;

    try {
      if (isPlaying) {
        fadeTo(audio, 0);

        window.setTimeout(() => {
          audio.pause();
          setIsPlaying(false);
        }, 700);

        return;
      }

      // If we haven't started playback yet, try to play (may be blocked until user gesture).
      audio.muted = false;
      audio.volume = 0;
      await audio.play();
      fadeTo(audio, 0.25);
      setStarted(true);
      setIsPlaying(true);
    } catch (error) {
      console.log("Audio could not start:", error);
    }
  }

  useEffect(() => {
    const audio = audioRef.current;

    // Try a muted autoplay on mount — many browsers allow muted autoplay.
    if (audio && !started) {
      audio.muted = true;
      audio.volume = 0;

      audio.play().then(() => {
        setStarted(true);
        // We keep isPlaying=false until the user gesture un-mutes.
        setIsPlaying(false);
      }).catch(() => {
        // muted autoplay failed — we'll wait for a gesture
      });
    }

    const handleFirstGesture = () => {
      // On first gesture, unmute and fade in.
      startMusic();
    };

    window.addEventListener("scroll", handleFirstGesture, { once: true });
    window.addEventListener("wheel", handleFirstGesture, { once: true });
    window.addEventListener("touchmove", handleFirstGesture, { once: true });
    window.addEventListener("pointerdown", handleFirstGesture, { once: true });
    window.addEventListener("click", handleFirstGesture, { once: true });
    window.addEventListener("keydown", handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener("scroll", handleFirstGesture);
      window.removeEventListener("wheel", handleFirstGesture);
      window.removeEventListener("touchmove", handleFirstGesture);
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("click", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
    };
  }, [started]);
 
 const audioSrc = "/audio/amen.mp3";

  return (
    <>
      <audio ref={audioRef} src={audioSrc} preload="auto" playsInline />

      <motion.button
        type="button"
        onClick={toggleMusic}
        whileHover={{ scale: 1.04, y: -1 }}
        whileTap={{ scale: 0.96 }}
        className={`${playfair.className} fixed left-3 top-[3.35rem] z-[110] min-w-[104px] rounded-full border border-[#c9a76b]/70 bg-[#f8efe2] px-4 py-2.5 text-center text-[0.58rem] font-black uppercase tracking-[0.2em] text-[#a77b34] shadow-[0_16px_50px_rgba(36,59,90,0.12)] transition hover:border-[#b88a3d] hover:bg-[#fff8ed] sm:left-8 sm:top-[4.8rem] sm:min-w-[150px] sm:px-7 sm:py-3 sm:text-xs`}
      >
        {isPlaying ? "Music On" : "Play Music"}
      </motion.button>
    </>
  );
}

function CountdownTimer({ compact = false }: { compact?: boolean }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    setTimeLeft(getTimeLeft());

    const timer = window.setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className={
        compact
          ? "grid grid-cols-4 gap-1.5 rounded-full border border-[#c9a76b]/20 bg-[#fff8ed]/90 px-3 py-2.5 shadow-[0_22px_80px_rgba(36,59,90,0.13)] backdrop-blur-md sm:gap-3 sm:px-6 sm:py-4"
          : "mt-8 grid grid-cols-4 gap-2 rounded-full border border-[#c9a76b]/30 bg-[#f8efe2]/75 px-4 py-3 shadow-[0_24px_90px_rgba(36,59,90,0.13)] backdrop-blur sm:mt-10 sm:gap-3 sm:px-5 sm:py-4 md:mt-12 md:gap-8 md:px-10"
      }
    >
      <TimeBlock value={timeLeft.days} label="Days" compact={compact} />
      <TimeBlock value={timeLeft.hours} label="Hours" compact={compact} />
      <TimeBlock value={timeLeft.minutes} label="Mins" compact={compact} />
      <TimeBlock value={timeLeft.seconds} label="Secs" compact={compact} />
    </div>
  );
}

function TimeBlock({
  value,
  label,
  compact = false,
}: {
  value: number;
  label: string;
  compact?: boolean;
}) {
  return (
    <div className="flex min-w-7 flex-col items-center text-[#243b5a] sm:min-w-10">
      <span
        className={`${cormorant.className} ${
          compact
            ? "text-base sm:text-xl md:text-2xl"
            : "text-2xl sm:text-3xl md:text-5xl"
        } font-medium leading-none`}
      >
        {value.toString().padStart(2, "0")}
      </span>

      <span
        className={
          compact
            ? "mt-1 text-[6px] uppercase tracking-[0.14em] text-[#7b6f64] sm:mt-2 sm:text-[8px] sm:tracking-[0.2em]"
            : "mt-2 text-[8px] uppercase tracking-[0.22em] text-[#6f7f96] sm:text-[10px] sm:tracking-[0.28em]"
        }
      >
        {label}
      </span>
    </div>
  );
}


function ScrollDownArrow() {
  return (
    <motion.div
      className="mt-7 flex flex-col items-center justify-center"
      animate={{
        y: [0, 12, 0],
        opacity: [0.68, 1, 0.68],
      }}
      transition={{
        duration: 2.1,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <motion.svg
        width="44"
        height="44"
        viewBox="0 0 24 24"
        fill="none"
        className="text-[#b88a3d] drop-shadow-[0_0_18px_rgba(201,167,107,0.95)]"
        animate={{
          filter: [
            "drop-shadow(0 0 8px rgba(201,167,107,0.45))",
            "drop-shadow(0 0 20px rgba(201,167,107,0.95))",
            "drop-shadow(0 0 8px rgba(201,167,107,0.45))",
          ],
        }}
        transition={{
          duration: 2.1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <path
          d="M6 9.5 12 15.5 18 9.5"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.svg>
    </motion.div>
  );
}

function FloatingDust() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 22 }).map((_, index) => (
        <span
          key={index}
          className="animate-dust absolute h-1 w-1 rounded-full bg-[#c9a76b]/40 shadow-[0_0_16px_rgba(201,167,107,0.45)]"
          style={{
            left: `${8 + ((index * 17) % 86)}%`,
            top: `${10 + ((index * 23) % 78)}%`,
            animationDelay: `${index * 0.8}s`,
            animationDuration: `${7 + (index % 5)}s`,
          }}
        />
      ))}
    </div>
  );
}

function BotanicalLine({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute opacity-35 ${className}`}>
      <svg
        width="190"
        height="260"
        viewBox="0 0 190 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-[#d8b77e]"
      >
        <path
          d="M91 244C93 184 82 123 42 45"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M72 194C47 187 33 169 20 147C47 153 65 168 72 194Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M78 160C49 145 38 121 31 94C60 108 76 130 78 160Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M63 116C41 101 31 80 27 56C52 68 64 88 63 116Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M93 204C123 191 141 168 154 138C122 145 101 168 93 204Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M88 169C119 151 133 124 140 94C108 111 91 136 88 169Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M73 125C101 103 111 76 112 47C86 67 74 93 73 125Z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

function Polaroid({
  id,
  className,
  rotate,
  tapePosition = "top",
  hoveredFrame,
  setHoveredFrame,
  image,
}: {
  id: string;
  className?: string;
  rotate: number;
  tapePosition?: "top" | "bottom";
  hoveredFrame: string | null;
  setHoveredFrame: (id: string | null) => void;
  image: string;
}) {
  const isHovered = hoveredFrame === id;
  const isAnotherHovered = hoveredFrame !== null && !isHovered;

  return (
    <motion.div
      onMouseEnter={() => setHoveredFrame(id)}
      onMouseLeave={() => setHoveredFrame(null)}
      animate={{
        scale: isHovered ? 1.55 : 1,
        rotate: isHovered ? 0 : rotate,
        opacity: isAnotherHovered ? 0.65 : 1,
        zIndex:
          isHovered ? 120 : id === "journey" ? 70 : id === "thus" ? 50 : 40,
      }}
      transition={{ duration: 0.42, ease: "easeOut" }}
      className={`absolute h-[168px] w-[134px] cursor-pointer bg-white p-2 pb-8 shadow-[0_18px_38px_rgba(36,59,90,0.16)] min-[390px]:h-[188px] min-[390px]:w-[150px] sm:h-[260px] sm:w-[210px] sm:p-3 sm:pb-12 md:h-[295px] md:w-[240px] md:pb-14 ${
        isHovered ? "shadow-[0_45px_120px_rgba(36,59,90,0.35)]" : ""
      } ${className}`}
    >
      <div className="h-full w-full overflow-hidden rounded-[2px] bg-[#dedede]">
        <img
          src={image}
          alt={id}
          className="h-full w-full object-cover object-center"
        />
      </div>

      <div
        className={`absolute left-1/2 h-5 w-12 -translate-x-1/2 bg-[#d8c3a5]/70 shadow-sm sm:h-7 sm:w-16 md:h-8 md:w-20 ${
          tapePosition === "top" ? "-top-2 sm:-top-3" : "-bottom-2 sm:-bottom-3"
        }`}
      />
    </motion.div>
  );
}

function PolaroidFrames({
  hoveredFrame,
  setHoveredFrame,
}: {
  hoveredFrame: string | null;
  setHoveredFrame: (id: string | null) => void;
}) {
  return (
    <div className="relative h-[370px] w-[300px] max-w-[92vw] min-[390px]:h-[410px] min-[390px]:w-[335px] sm:h-[620px] sm:w-[620px] md:h-[650px] md:w-[760px]">
      <BotanicalLine className="-left-20 top-28 hidden -rotate-[18deg] sm:block" />
      <BotanicalLine className="-right-28 top-48 hidden rotate-[34deg] sm:block" />

      <Polaroid
        id="our"
        image={POLAROID_IMAGES[0]}
        className="left-[12px] top-[20px] min-[390px]:left-[14px] min-[390px]:top-[24px] sm:left-[70px] sm:top-[45px] md:left-[95px]"
        rotate={-4}
        hoveredFrame={hoveredFrame}
        setHoveredFrame={setHoveredFrame}
      />

      <Polaroid
        id="journey"
        image={POLAROID_IMAGES[1]}
        className="right-[12px] top-[48px] min-[390px]:right-[14px] min-[390px]:top-[58px] sm:right-[70px] sm:top-[80px] md:right-[95px]"
        rotate={7}
        hoveredFrame={hoveredFrame}
        setHoveredFrame={setHoveredFrame}
      />

      <Polaroid
        id="thus"
        image={POLAROID_IMAGES[2]}
        className="bottom-[44px] left-[12px] min-[390px]:bottom-[48px] min-[390px]:left-[14px] sm:bottom-[0px] sm:left-[70px] md:left-[95px]"
        rotate={4}
        hoveredFrame={hoveredFrame}
        setHoveredFrame={setHoveredFrame}
      />

      <Polaroid
        id="far"
        image={POLAROID_IMAGES[3]}
        className="bottom-[20px] right-[12px] min-[390px]:bottom-[22px] min-[390px]:right-[14px] sm:bottom-[-20px] sm:right-[85px] md:right-[110px]"
        rotate={-3}
        tapePosition="bottom"
        hoveredFrame={hoveredFrame}
        setHoveredFrame={setHoveredFrame}
      />
    </div>
  );
}

function ImageCarousel() {
  const carouselImages = [...CAROUSEL_IMAGES, ...CAROUSEL_IMAGES];

  return (
    <div className="h-full w-[100dvw] overflow-hidden">
      <motion.div
        className="flex h-full w-max gap-0"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 42,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {carouselImages.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className="relative h-full w-[68dvw] shrink-0 overflow-hidden bg-[#dedede] sm:w-[34dvw] md:w-[24dvw]"
          >
            <img
              src={src}
              alt={`Carousel photo ${(index % CAROUSEL_IMAGES.length) + 1}`}
              className="h-full w-full object-cover object-center"
              loading="eager"
              draggable={false}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#243b5a]/10 via-transparent to-transparent" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function RootsWrap({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-6xl px-3 py-14 sm:px-6 sm:py-20">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible text-[#b88a3d]/65"
        viewBox="0 0 1000 760"
        preserveAspectRatio="none"
        fill="none"
      >
        <motion.path
          d="M500 0 C500 95 500 130 500 185 C500 255 425 282 300 295 C158 310 82 395 122 512 C162 625 318 656 500 626 C682 656 838 625 878 512 C918 395 842 310 700 295 C575 282 500 255 500 185"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 2.2, ease: "easeInOut" }}
        />
      </svg>

      <div className="relative z-10">{children}</div>
    </div>
  );
}

function DressCodeSection() {
  return (
    <RootsWrap>
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-2 text-xs uppercase tracking-[0.42em] text-[#9c8261]"
        >
          Wedding Style
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className={`${playfair.className} mb-8 text-4xl font-black text-[#243b5a] sm:text-6xl`}
        >
          Color & Dress Code
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 34 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: "easeOut" }}
          className="grid w-full gap-5 md:grid-cols-2"
        >
          <div className="rounded-[2rem] border border-[#c9a76b]/35 bg-[#fff8ed]/85 p-6 shadow-[0_24px_80px_rgba(36,59,90,0.1)] backdrop-blur">
            <p className="mb-2 text-xs uppercase tracking-[0.38em] text-[#9c8261]">
              Color Code
            </p>

            <h3
              className={`${playfair.className} mb-5 text-3xl font-black text-[#243b5a] sm:text-4xl`}
            >
              Champagne, Beige & a Touch of Blue
            </h3>

            <div className="mb-5 flex flex-wrap justify-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <span className="h-12 w-12 rounded-full border border-[#d8b77e]/70 bg-[radial-gradient(circle_at_30%_22%,#fff8e8_0%,#f6e4c1_28%,#d8b77e_62%,#b88a3d_100%)] shadow-[inset_0_4px_10px_rgba(255,255,255,0.7),inset_0_-8px_14px_rgba(120,82,35,0.16),0_10px_24px_rgba(201,167,107,0.22)]" />
                <span className="text-xs uppercase tracking-[0.2em] text-[#6f7f96]">
                  Champagne
                </span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="h-12 w-12 rounded-full border border-[#c9a76b]/50 bg-[#e7d2b5] shadow-inner" />
                <span className="text-xs uppercase tracking-[0.2em] text-[#6f7f96]">
                  Beige
                </span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="h-12 w-12 rounded-full border border-[#9fb5cf]/70 bg-[#b9cce2] shadow-inner" />
                <span className="text-xs uppercase tracking-[0.2em] text-[#6f7f96]">
                  Touch of Blue
                </span>
              </div>
            </div>

            <p className="text-sm leading-6 text-[#4d5f78]">
              Guests are warmly encouraged to wear shades of champagne, beige,
              and soft neutral tones.
            </p>

            <p className="mt-3 text-sm leading-6 text-[#4d5f78]">
              <span className="font-black text-[#243b5a]">
                Please keep the blue as a subtle accent only.
              </span>
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#c9a76b]/35 bg-[#fff8ed]/85 p-6 shadow-[0_24px_80px_rgba(36,59,90,0.1)] backdrop-blur">
            <p className="mb-2 text-xs uppercase tracking-[0.38em] text-[#9c8261]">
              Dress Code
            </p>

            <h3
              className={`${playfair.className} mb-5 text-3xl font-black text-[#243b5a] sm:text-4xl`}
            >
              Formal
            </h3>
        
            <h3
              className={`${playfair.className} mb-5 text-3xl font-black text-[#243b5a] sm:text-4xl`}
            >
            Or
            </h3>

            <h3
              className={`${playfair.className} mb-5 text-3xl font-black text-[#243b5a] sm:text-4xl`}
            >
              Traditional Attire
            </h3>


            <div className="space-y-4 text-base leading-7 text-[#4d5f78]">
              <p>
                We kindly invite our guests to join us in celebrating this
                special day dressed in elegant formal attire.
              </p>

              <p>
                <span className="font-black text-[#243b5a]">Ladies:</span>{" "}
                Help us celebrate in style! We would love for our female guests
                to wear a beautiful{" "}
                <span className="font-bold text-[#243b5a]">gele</span> or a
                fabulous{" "}
                <span className="font-bold text-[#243b5a]">fascinator</span>,
                adding a graceful and celebratory touch to the occasion.
              </p>

              <p>
                <span className="font-black text-[#243b5a]">Gentlemen:</span>{" "}
                Black Tie Optional or Traditional Attire.
              </p>
              <p>
                <span className="font-black text-[#243b5a]">For all our guests who would like to purchase aso ebi ( wedding traditional attire ), please contact 084 451 0707   / 066 265 7456 </span>{" "}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </RootsWrap>
  );
}


function MapPinIcon({ active = false }: { active?: boolean }) {
  return (
    <motion.div
      animate={{
        y: active ? -5 : 0,
        scale: active ? 1.08 : 1,
      }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative flex h-[58px] w-[58px] items-center justify-center"
    >
      <motion.span
        animate={{
          opacity: active ? [0.22, 0.5, 0.22] : 0,
          scale: active ? [0.88, 1.18, 0.88] : 0.88,
        }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full bg-[#c9a76b]/35 blur-xl"
      />

      <motion.svg
        width="52"
        height="52"
        viewBox="0 0 24 24"
        fill="none"
        className="relative z-10 drop-shadow-[0_14px_26px_rgba(185,28,28,0.24)]"
      >
        <motion.path
          d="M12 22s7-6.2 7-13A7 7 0 0 0 5 9c0 6.8 7 13 7 13Z"
          fill={active ? "#b91c1c" : "#c62828"}
          animate={{
            filter: active
              ? [
                  "drop-shadow(0 0 0 rgba(201,167,107,0))",
                  "drop-shadow(0 0 12px rgba(201,167,107,0.72))",
                  "drop-shadow(0 0 0 rgba(201,167,107,0))",
                ]
              : "drop-shadow(0 0 0 rgba(201,167,107,0))",
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <circle cx="12" cy="9" r="2.6" fill="#fff8ed" />
      </motion.svg>
    </motion.div>
  );
}

function LocationMapsSection() {
  const [activeLocation, setActiveLocation] = useState<
    "church" | "reception" | null
  >(null);

    const locations = [
      {
        id: "church" as const,
        title: "Church Ceremony",
        address: "St Hilda Parish Church, Pretoria, South Africa",
        mapQuery: "St Hilda Parish Church Pretoria South Africa",
      },
      {
        id: "reception" as const,
        title: "Reception",
        address: "Silver Lakes Farm Hotel, Pretoria, South Africa",
        mapQuery: "Silver Lakes Farm Hotel Pretoria South Africa",
      },
    ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.75, ease: "easeOut" }}
      className="mx-auto mt-24 flex w-full max-w-5xl flex-col items-center text-center sm:mt-32"
    >
      <p className="mb-3 text-xs uppercase tracking-[0.42em] text-[#9c8261]">
        
      </p>

      <motion.h2
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65 }}
        className={`${playfair.className} mb-16 text-5xl font-black text-[#243b5a] sm:text-7xl`}
      >
        Where to be
      </motion.h2>

      <div className="flex w-full flex-col items-center gap-20 sm:gap-24">
        {locations.map((location) => {
          const isActive = activeLocation === location.id;

          return (
            <div
              key={location.id}
              onMouseEnter={() => setActiveLocation(location.id)}
              onMouseLeave={() => setActiveLocation(null)}
              onFocus={() => setActiveLocation(location.id)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setActiveLocation(null);
                }
              }}
              className="flex w-full flex-col items-center"
            >
              <button
                type="button"
                onClick={() =>
                  setActiveLocation((current) =>
                    current === location.id ? null : location.id
                  )
                }
                className="group flex flex-col items-center outline-none"
              >
                <MapPinIcon active={isActive} />

                <span
                  className={`${playfair.className} relative mt-4 text-xl font-black uppercase tracking-[0.24em] text-[#9c6f2d] transition duration-300 group-hover:text-[#b91c1c] sm:text-3xl`}
                >
                  {location.title}

                  <span className="absolute -bottom-3 left-1/2 h-px w-[115%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#b88a3d] to-transparent" />
                  <span className="absolute -bottom-5 left-1/2 h-px w-[72%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#d8c3a5] to-transparent" />
                </span>
              </button>

              <AnimatePresence mode="wait">
                {isActive && (
                  <motion.div
                    key={location.id}
                    initial={{
                      opacity: 0,
                      y: 30,
                      scale: 0.96,
                      filter: "blur(10px)",
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      filter: "blur(0px)",
                    }}
                    exit={{
                      opacity: 0,
                      y: 18,
                      scale: 0.96,
                      filter: "blur(10px)",
                    }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-12 w-full max-w-4xl overflow-hidden rounded-[2rem] border border-[#c9a76b]/35 bg-[#fff8ed]/95 shadow-[0_34px_120px_rgba(36,59,90,0.18)] backdrop-blur"
                  >
                    <div className="px-5 py-7 text-center sm:px-8 sm:py-8">
                      <h3
                        className={`${playfair.className} text-2xl font-black uppercase tracking-[0.2em] text-[#b91c1c] sm:text-4xl`}
                      >
                        {location.title}
                      </h3>

                      <div className="mx-auto my-5 h-px w-44 bg-gradient-to-r from-transparent via-[#c9a76b] to-transparent" />

                      <p className="text-sm leading-7 text-[#4d5f78] sm:text-base">
                        {location.address}
                      </p>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          location.mapQuery
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-block text-sm font-bold text-[#b91c1c] underline decoration-[#b88a3d] underline-offset-4"
                      >
                        View on Google Maps
                      </a>
                    </div>

                    <div className="h-[270px] w-full sm:h-[390px]">
                      <iframe
                        title={`${location.title} map`}
                        src={`https://www.google.com/maps?q=${encodeURIComponent(
                          location.mapQuery
                        )}&output=embed`}
                        className="h-full w-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}


function RegistrySection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65 }}
      className="mt-8 w-full rounded-[2rem] border border-[#c9a76b]/35 bg-[#fff8ed]/85 p-6 text-center shadow-[0_24px_80px_rgba(36,59,90,0.1)] backdrop-blur sm:p-8"
    >
      <p className="mb-3 text-xs uppercase tracking-[0.42em] text-[#9c8261]">
        Wedding Registry
      </p>

      <h2
        className={`${playfair.className} mb-4 text-3xl font-black text-[#243b5a] sm:text-5xl`}
      >
        Your Presence Is Our Greatest Gift
      </h2>

      <p className="mx-auto mb-8 max-w-2xl text-sm leading-7 text-[#4d5f78] sm:text-base">
        Celebrating this special day with the people we love is more than we
        could ever ask for. Should you wish to bless us with a gift, we would
        be deeply grateful for a contribution towards our future together.
        Your generosity, prayers, and support mean the world to us as we begin
        this new chapter as husband and wife.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.6rem] border border-[#c9a76b]/35 bg-[#fff8ed]/80 p-5 shadow-[0_14px_42px_rgba(36,59,90,0.08)]">
          <h3
            className={`${playfair.className} mb-4 text-2xl font-black text-[#243b5a]`}
          >
            TymeBank / GoTyme
          </h3>

          <div className="space-y-2 text-sm text-[#4d5f78]">
            <p>
              <span className="font-bold text-[#243b5a]">
                Account Holder:
              </span>{" "}
              Funso Joseph Idowu
            </p>

            <p>
              <span className="font-bold text-[#243b5a]">Bank Name:</span>{" "}
              TymeBank / GoTyme
            </p>

            <p>
              <span className="font-bold text-[#243b5a]">Branch Code:</span>{" "}
              678910
            </p>

            <p>
              <span className="font-bold text-[#243b5a]">
                Account Number:
              </span>{" "}
              51052587164
            </p>
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-[#c9a76b]/35 bg-[#fff8ed]/80 p-5 shadow-[0_14px_42px_rgba(36,59,90,0.08)]">
          <h3
            className={`${playfair.className} mb-4 text-2xl font-black text-[#243b5a]`}
          >
            Capitec
          </h3>

          <div className="space-y-2 text-sm text-[#4d5f78]">
            <p>
              <span className="font-bold text-[#243b5a]">
                Account Holder:
              </span>{" "}
              Funso Joseph Idowu
            </p>

            <p>
              <span className="font-bold text-[#243b5a]">Bank Name:</span>{" "}
              Capitec Bank
            </p>

            <p>
              <span className="font-bold text-[#243b5a]">
                Account Number:
              </span>{" "}
              2529873840
            </p>

            <p>
              <span className="font-bold text-[#243b5a]">Branch Code:</span>{" "}
              470010
            </p>

            <p>
              <span className="font-bold text-[#243b5a]">Swift Code:</span>{" "}
              CABLZAJJ
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[1.6rem] border border-[#c9a76b]/35 bg-[#fff8ed]/80 p-5 shadow-[0_14px_42px_rgba(36,59,90,0.08)]">
        <h3
          className={`${playfair.className} mb-4 text-2xl font-black text-[#243b5a]`}
        >
          PayPal
        </h3>

        <p className="mx-auto mb-4 max-w-xl text-sm leading-6 text-[#4d5f78]">
          For guests celebrating with us from abroad, PayPal may be the most
          convenient way to send a gift. Contributions can be made using
          either the email address or mobile number below.
        </p>

        <div className="space-y-2 text-sm text-[#4d5f78]">
          <p>
            <span className="font-bold text-[#243b5a]">PayPal Email:</span>{" "}
            joseph.f.idowu@gmail.com
          </p>

          <p>
            <span className="font-bold text-[#243b5a]">PayPal Mobile:</span>{" "}
            +27 74 084 1686
          </p>
        </div>
      </div>

      <div className="mx-auto mt-5 max-w-md rounded-full border border-[#c9a76b]/45 bg-[#fff8ed]/90 px-5 py-3 text-center shadow-[0_14px_42px_rgba(36,59,90,0.08)]">
        <p className="text-xs uppercase tracking-[0.28em] text-[#9c8261]">
          PayShap
        </p>

        <p
          className={`${playfair.className} text-xl font-black text-[#243b5a]`}
        >
          0740841686
        </p>
      </div>

      <p className="mx-auto mt-8 max-w-xl text-center text-sm italic text-[#6f7f96]">
        Thank you for celebrating with us and for being part of our story.
        Your love, support, and well wishes are the greatest gifts we could
        receive.
      </p>
    </motion.div>
  );
}

function OrderOfDaySection() {
  const events = [
    {
      time: "11:00",
      title: "Church Ceremony",
      icon: "church" as const,
    },
    {
      time: "13:30",
      title: "Cocktail Hour & Photography",
      icon: "cocktail-camera" as const,
    },
    {
      time: "14:30",
      title: "Reception",
      icon: "dining" as const,
    },
    {
      time: "19:00",
      title: "End of Reception",
      icon: "party" as const,
    },
  ];

  return (
    <RootsWrap>
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-2 text-xs uppercase tracking-[0.42em] text-[#9c8261]"
        >
          
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className={`${playfair.className} mb-10 text-4xl font-black text-[#243b5a] sm:text-6xl`}
        >
          Order of Events
        </motion.h2>

        <div className="relative w-full">
          <motion.div
            className="absolute left-5 top-0 hidden h-full w-px bg-[#b88a3d]/60 sm:block"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{ transformOrigin: "top" }}
          />

          <div className="space-y-6">
            {events.map((event, index) => (
              <motion.div
                key={event.title}
                initial={{ opacity: 0, x: 32 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, delay: index * 0.1 }}
                className="relative rounded-[1.7rem] border border-[#c9a76b]/35 bg-[#fff8ed]/85 p-5 text-left shadow-[0_18px_60px_rgba(36,59,90,0.09)] backdrop-blur sm:ml-14"
              >
                <span className="absolute -left-[3.65rem] top-1/2 hidden h-6 w-6 -translate-y-1/2 rounded-full border border-[#b88a3d] bg-[#d8c3a5] shadow-[0_0_0_6px_rgba(248,239,226,0.95)] sm:block" />

                <div className="flex items-center gap-4">
                  <EventIcon type={event.icon} />

                  <p
                    className={`${playfair.className} text-3xl font-black text-[#243b5a]`}
                  >
                    {event.time}
                  </p>
                </div>

                <div className="my-2 h-px w-40 bg-gradient-to-r from-[#b88a3d]/80 to-transparent" />

                <p className="text-lg uppercase tracking-[0.16em] text-[#4d5f78]">
                  {event.title}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        <LocationMapsSection />

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="mt-10 rounded-[2rem] border border-[#c9a76b]/35 bg-[#fff8ed]/85 p-6 text-center shadow-[0_24px_80px_rgba(36,59,90,0.1)] backdrop-blur"
        >
          <p className="mb-4 text-base leading-7 text-[#4d5f78]">
            <span className="font-black text-[#243b5a]">
              Do not extend this invitation, as it is for invited guests only.
            </span>
          </p>

          <p className="text-base leading-7 text-[#4d5f78]">
            We love and adore your little ones, but we kindly ask that this
            remains an adults-only celebration.
          </p>

          <div className="mx-auto my-5 h-px w-44 bg-gradient-to-r from-transparent via-[#c9a76b] to-transparent" />

          <p className="text-sm font-bold leading-6 text-[#4d5f78]">
            All wedding communication will be sent and shared via email, SMS,
            and WhatsApp.
          </p>

          <div className="mx-auto my-5 h-px w-44 bg-gradient-to-r from-transparent via-[#c9a76b] to-transparent" />

          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#9c6f2d]">
            RSVP Deadline: {RSVP_DEADLINE}
          </p>
        </motion.div>

        <RegistrySection />
      </div>
    </RootsWrap>
  );
}

function RegistryButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      animate={{
        scale: [1, 1.03, 1],
        boxShadow: [
          "0 16px 50px rgba(36,59,90,0.12)",
          "0 20px 70px rgba(201,167,107,0.25)",
          "0 16px 50px rgba(36,59,90,0.12)",
        ],
      }}
      transition={{
        duration: 5.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={`${playfair.className} fixed left-3 top-3 z-[110] min-w-[104px] rounded-full border border-[#c9a76b]/70 bg-[#f8efe2] px-4 py-2.5 text-center text-[0.58rem] font-black uppercase tracking-[0.2em] text-[#a77b34] shadow-[0_16px_50px_rgba(36,59,90,0.12)] transition hover:border-[#b88a3d] hover:bg-[#fff8ed] sm:left-8 sm:top-8 sm:min-w-[150px] sm:px-7 sm:py-3 sm:text-xs sm:tracking-[0.24em]`}
    >
      Registry
    </motion.button>
  );
}

function RSVPButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={{ scale: [1, 1.035, 1] }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div className="absolute h-20 w-64 rounded-full bg-[#c9a76b]/25 blur-2xl sm:h-24 sm:w-80" />

      <div className="flex items-center gap-2 sm:gap-6">
        <span className="h-[2px] w-7 bg-gradient-to-r from-transparent via-[#c9a76b] to-[#c9a76b] sm:w-28" />

        <motion.button
          type="button"
          onClick={onClick}
          whileHover={{ scale: 1.08, y: -3 }}
          whileTap={{ scale: 0.97 }}
          className={`${playfair.className} group relative overflow-hidden rounded-full border-2 border-[#c9a76b] bg-[#f8efe2] px-8 py-3.5 text-xs font-black uppercase tracking-[0.32em] text-[#b88a3d] shadow-[0_28px_85px_rgba(36,59,90,0.18)] transition-all duration-300 hover:border-[#d6b06d] hover:shadow-[0_32px_100px_rgba(201,167,107,0.28)] sm:px-16 sm:py-5 sm:text-base sm:tracking-[0.42em]`}
        >
          <span
            className="relative z-10 font-black"
            style={{
              textShadow: "0 1px 0 rgba(255,255,255,0.4)",
              fontWeight: 900,
            }}
          >
            RSVP
          </span>

          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/65 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
        </motion.button>

        <span className="h-[2px] w-7 bg-gradient-to-l from-transparent via-[#c9a76b] to-[#c9a76b] sm:w-28" />
      </div>
    </motion.div>
  );
}


function FloatingRSVPButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.96 }}
      className={`${playfair.className} rounded-full border border-[#c9a76b]/70 bg-[#f8efe2] px-4 py-2.5 text-[0.58rem] font-black uppercase tracking-[0.2em] text-[#a77b34] shadow-[0_16px_50px_rgba(36,59,90,0.12)] transition hover:border-[#b88a3d] hover:bg-[#fff8ed] sm:px-7 sm:py-3 sm:text-xs`}
    >
      RSVP
    </motion.button>
  );
}



type EventIconType = "church" | "cocktail-camera" | "dining" | "party";

function EventIcon({ type }: { type: EventIconType }) {
  const baseClass =
    "h-10 w-10 text-[#b88a3d] drop-shadow-[0_0_10px_rgba(201,167,107,0.35)] sm:h-12 sm:w-12";

  if (type === "church") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 64 64"
        fill="none"
        className={baseClass}
      >
        <path
          d="M32 7v14"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M25.5 14h13"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M13 56h38"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M18 56V30.5L32 20l14 10.5V56"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <path
          d="M25 56V43a7 7 0 0 1 14 0v13"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <path
          d="M23 32h18"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.65"
        />
      </svg>
    );
  }

  if (type === "cocktail-camera") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 82 64"
        fill="none"
        className="h-10 w-14 text-[#b88a3d] drop-shadow-[0_0_10px_rgba(201,167,107,0.35)] sm:h-12 sm:w-16"
      >
        <path
          d="M12 11h24L27 28h-6L12 11Z"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M24 28v19"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M16 47h16"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M50 20h8l3-4h8l3 4h4a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H50a4 4 0 0 1-4-4V24a4 4 0 0 1 4-4Z"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <circle
          cx="63"
          cy="35"
          r="7.5"
          stroke="currentColor"
          strokeWidth="2.4"
        />
        <path
          d="M67 24h5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.65"
        />
      </svg>
    );
  }

  if (type === "dining") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 82 64"
        fill="none"
        className="h-10 w-14 text-[#b88a3d] drop-shadow-[0_0_10px_rgba(201,167,107,0.35)] sm:h-12 sm:w-16"
      >
        <path
          d="M18 12v40"
          stroke="currentColor"
          strokeWidth="2.7"
          strokeLinecap="round"
        />
        <path
          d="M12 12v16M18 12v16M24 12v16M12 28c0 4 12 4 12 0"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="43"
          cy="32"
          r="16"
          stroke="currentColor"
          strokeWidth="2.7"
        />
        <circle
          cx="43"
          cy="32"
          r="9.5"
          stroke="currentColor"
          strokeWidth="2.2"
          opacity="0.6"
        />
        <path
          d="M69 12c-5.5 5.2-7 11.7-7 20.5h8.5V52"
          stroke="currentColor"
          strokeWidth="2.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 82 64"
      fill="none"
      className="h-10 w-14 text-[#b88a3d] drop-shadow-[0_0_10px_rgba(201,167,107,0.35)] sm:h-12 sm:w-16"
    >
      <path
        d="M41 7v8"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle
        cx="41"
        cy="36"
        r="18"
        stroke="currentColor"
        strokeWidth="2.7"
      />
      <path
        d="M25 28h32M24 36h34M27 44h28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M33 19c-3 10-3 24 0 34M49 19c3 10 3 24 0 34M41 18v36"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M20 18 14 13M62 18l6-5M16 36H8M66 36h8M23 54l-5 5M59 54l5 5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M18 8 20 4l2 4 4 2-4 2-2 4-2-4-4-2 4-2ZM64 6l1.5-3L67 6l3 1.5L67 9l-1.5 3L64 9l-3-1.5L64 6ZM10 48l1.5-3 1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5ZM70 48l1.5-3 1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <path
        d="M35 30h4M44 30h4M35 39h4M44 39h4"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HourglassIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      fill="none"
      className="h-14 w-14"
    >
      <path
        d="M20 8h24M20 56h24"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M23 10c0 12 5 17 9 22-4 5-9 10-9 22M41 10c0 12-5 17-9 22 4 5 9 10 9 22"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M26 19h12M28 45h8M32 32v8"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.72"
      />
      <path
        d="M28 25c2 2 6 2 8 0M27 48c3-4 7-4 10 0"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}


function EventActionButtons({ onComingSoon }: { onComingSoon: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-4 px-4 py-14 sm:flex-row sm:gap-5 sm:py-20">
      <motion.button
        type="button"
        onClick={onComingSoon}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.96 }}
        className={`${playfair.className} w-full max-w-sm rounded-full border border-[#c9a76b]/70 bg-[#f8efe2]/90 px-7 py-4 text-[0.72rem] font-black uppercase tracking-[0.28em] text-[#a77b34] shadow-[0_18px_60px_rgba(36,59,90,0.12)] backdrop-blur-md transition hover:border-[#b88a3d] hover:bg-[#fff8ed] sm:w-auto sm:px-12 sm:text-xs`}
      >
        Menu
      </motion.button>

      <motion.button
        type="button"
        onClick={onComingSoon}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.96 }}
        className={`${playfair.className} w-full max-w-sm rounded-full border border-[#c9a76b]/70 bg-[#f8efe2]/90 px-7 py-4 text-[0.72rem] font-black uppercase tracking-[0.28em] text-[#a77b34] shadow-[0_18px_60px_rgba(36,59,90,0.12)] backdrop-blur-md transition hover:border-[#b88a3d] hover:bg-[#fff8ed] sm:w-auto sm:px-12 sm:text-xs`}
      >
        Upload Wedding Content
      </motion.button>
    </div>
  );
}

function ComingSoonModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-[#243b5a]/20 px-4 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            aria-label="Close coming soon modal"
            onClick={onClose}
            className="absolute inset-0"
          />

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.94, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 18, scale: 0.96, filter: "blur(10px)" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-[2.2rem] border border-white/50 bg-white/25 px-6 py-8 text-center shadow-[0_34px_120px_rgba(36,59,90,0.34)] backdrop-blur-2xl sm:px-9 sm:py-10"
          >
            <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-[#fff8ed]/45 blur-3xl" />
            <div className="absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-[#b9cce2]/45 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/42 via-[#fff8ed]/18 to-white/12" />

            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 z-20 rounded-full border border-[#c9a76b]/50 bg-[#fff8ed]/65 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.18em] text-[#9c8261] shadow-[0_10px_30px_rgba(36,59,90,0.1)] transition hover:bg-[#fff8ed]"
            >
              Close
            </button>

            <div className="relative z-10 flex flex-col items-center">
              <h2
                className={`${playfair.className} mt-5 text-4xl font-black text-[#243b5a] sm:text-5xl`}
              >
                Coming soon...
              </h2>

              <motion.div
                className="my-7 flex h-20 w-20 items-center justify-center text-[#b88a3d] drop-shadow-[0_0_18px_rgba(201,167,107,0.65)]"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <HourglassIcon />
              </motion.div>

              <p className="max-w-xs text-center text-sm font-bold leading-7 text-[#4d5f78] sm:text-base">
                (button will become functional on wedding day)
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


function ModalShell({
  open,
  onClose,
  children,
  maxWidth = "max-w-xl",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[#243b5a]/20 px-3 py-4 backdrop-blur-[5px] sm:px-4 sm:py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 36, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={`relative my-auto max-h-[94dvh] w-full ${maxWidth} overflow-y-auto rounded-[1.6rem] border border-[#c9a76b]/45 bg-[#f8efe2] px-4 py-6 text-center shadow-[0_40px_140px_rgba(36,59,90,0.32)] [scrollbar-width:none] sm:rounded-[2rem] sm:px-10 sm:py-10 [&::-webkit-scrollbar]:hidden`}
          >
            <div className="absolute -left-24 -top-24 h-48 w-48 rounded-full bg-[#d8c3a5]/40 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-[#b9cce2]/45 blur-3xl" />

            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ scale: 1.08, rotate: 2 }}
              whileTap={{ scale: 0.92 }}
              className="absolute right-4 top-4 z-20 rounded-full border border-[#c9a76b]/50 bg-[#fff8ed]/90 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.18em] text-[#9c8261] shadow-[0_10px_30px_rgba(36,59,90,0.1)] transition hover:bg-[#fff8ed] sm:right-5 sm:top-5 sm:text-xs sm:tracking-[0.2em]"
            >
              Close
            </motion.button>

            <div className="relative z-10">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RegistryModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <ModalShell open={open} onClose={onClose} maxWidth="max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <p className="mb-3 text-xs uppercase tracking-[0.42em] text-[#9c8261]">
          Wedding Registry
        </p>

        <h2
          className={`${playfair.className} mb-4 text-3xl font-black text-[#243b5a] sm:text-5xl`}
        >
          Your Presence Is Our Greatest Gift
        </h2>

        <p className="mx-auto mb-8 max-w-2xl text-sm leading-7 text-[#4d5f78] sm:text-base">
          Celebrating this special day with the people we love is more than we
          could ever ask for. Should you wish to bless us with a gift, we would
          be deeply grateful for a contribution towards our future together.
          Your generosity, prayers, and support mean the world to us as we begin
          this new chapter as husband and wife.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.6rem] border border-[#c9a76b]/35 bg-[#fff8ed]/80 p-5 shadow-[0_14px_42px_rgba(36,59,90,0.08)]">
            <h3
              className={`${playfair.className} mb-4 text-2xl font-black text-[#243b5a]`}
            >
              TymeBank / GoTyme
            </h3>

            <div className="space-y-2 text-sm text-[#4d5f78]">
              <p>
                <span className="font-bold text-[#243b5a]">
                  Account Holder:
                </span>{" "}
                Funso Joseph Idowu
              </p>

              <p>
                <span className="font-bold text-[#243b5a]">Bank Name:</span>{" "}
                TymeBank / GoTyme
              </p>

              <p>
                <span className="font-bold text-[#243b5a]">Branch Code:</span>{" "}
                678910
              </p>

              <p>
                <span className="font-bold text-[#243b5a]">
                  Account Number:
                </span>{" "}
                51052587164
              </p>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-[#c9a76b]/35 bg-[#fff8ed]/80 p-5 shadow-[0_14px_42px_rgba(36,59,90,0.08)]">
            <h3
              className={`${playfair.className} mb-4 text-2xl font-black text-[#243b5a]`}
            >
              Capitec
            </h3>

            <div className="space-y-2 text-sm text-[#4d5f78]">
              <p>
                <span className="font-bold text-[#243b5a]">
                  Account Holder:
                </span>{" "}
                Funso Joseph Idowu
              </p>

              <p>
                <span className="font-bold text-[#243b5a]">Bank Name:</span>{" "}
                Capitec Bank
              </p>

              <p>
                <span className="font-bold text-[#243b5a]">
                  Account Number:
                </span>{" "}
                2529873840
              </p>

              <p>
                <span className="font-bold text-[#243b5a]">Branch Code:</span>{" "}
                470010
              </p>

              <p>
                <span className="font-bold text-[#243b5a]">Swift Code:</span>{" "}
                CABLZAJJ
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[1.6rem] border border-[#c9a76b]/35 bg-[#fff8ed]/80 p-5 shadow-[0_14px_42px_rgba(36,59,90,0.08)]">
          <h3
            className={`${playfair.className} mb-4 text-2xl font-black text-[#243b5a]`}
          >
            PayPal
          </h3>

          <p className="mx-auto mb-4 max-w-xl text-sm leading-6 text-[#4d5f78]">
            For guests celebrating with us from abroad, PayPal may be the most
            convenient way to send a gift. Contributions can be made using
            either the email address or mobile number below.
          </p>

          <div className="space-y-2 text-sm text-[#4d5f78]">
            <p>
              <span className="font-bold text-[#243b5a]">PayPal Email:</span>{" "}
              joseph.f.idowu@gmail.com
            </p>

            <p>
              <span className="font-bold text-[#243b5a]">PayPal Mobile:</span>{" "}
              +27 74 084 1686
            </p>
          </div>
        </div>

        <div className="mx-auto mt-5 max-w-md rounded-full border border-[#c9a76b]/45 bg-[#fff8ed]/90 px-5 py-3 text-center shadow-[0_14px_42px_rgba(36,59,90,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#9c8261]">
            PayShap
          </p>

          <p
            className={`${playfair.className} text-xl font-black text-[#243b5a]`}
          >
            0740841686
          </p>
        </div>

        <p className="mx-auto mt-8 max-w-xl text-center text-sm italic text-[#6f7f96]">
          Thank you for celebrating with us and for being part of our story.
          Your love, support, and well wishes are the greatest gifts we could
          receive.
        </p>
      </motion.div>
    </ModalShell>
  );
}

function RSVPModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<RSVPStep>("surname");
  const [surname, setSurname] = useState("");
  const [submittedSurname, setSubmittedSurname] = useState("");
  const [selectedGuestGroup, setSelectedGuestGroup] =
    useState<GuestGroup>("bride-groom");
  const [family, setFamily] = useState<RSVPFamily | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedFamily[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const attendingWeddingCount = familyMembers.filter(
    (member) => member.attendingWedding
  ).length;

 
  function resetModal() {
    setStep("surname");
    setSurname("");
    setSubmittedSurname("");
    setFamily(null);
    setFamilyMembers([]);
    setSuggestions([]);
    setErrorMessage("");
  }

  useEffect(() => {
    if (!open) {
      const timer = window.setTimeout(() => {
        resetModal();
      }, 250);

      return () => window.clearTimeout(timer);
    }
  }, [open]);

function applyFamilyResponse(data: any) {
    setFamily(data.family);
    setSuggestions([]);

    setFamilyMembers(
      data.members.map((member: any) => ({
        id: member.id,
        fullName: member.fullName,
        attendingWedding: Boolean(member.attendingWedding),
        attendingChurch: Boolean(member.attendingChurch),
        churchEligible: member.churchEligible !== false,
        contactEmail: member.contactEmail ?? "",
        contactPhone: member.contactPhone ?? "",
        unableToAttend: Boolean(member.unableToAttend),
      }))
    );

    setStep("family");
  }

async function searchInvitation(searchValue: string) {
  const cleanSurname = searchValue.trim();

  if (!cleanSurname) return;

  setSubmittedSurname(cleanSurname);
  setSuggestions([]);
  setErrorMessage("");
  setStep("loading");

  try {
    const [response] = await Promise.all([
      fetch("/api/rsvp/family", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          surname: cleanSurname,
          guestGroup: selectedGuestGroup,
        }),
      }),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);

    const data = await response.json();

    if (!response.ok) {
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setErrorMessage(
          data.error ?? "We could not find an exact match. Did you mean one of these?"
        );
      } else {
        setSuggestions([]);
        setErrorMessage(
          data.error ?? "Family not found. Please check the spelling."
        );
      }

      setStep("surname");
      return;
    }

    applyFamilyResponse(data);
  } catch (error) {
    console.error(error);
    setSuggestions([]);
    setErrorMessage("Could not load your invitation. Please try again.");
    setStep("surname");
  }
}

async function handleSurnameSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  await searchInvitation(surname);
}

  function updateMemberContact(
    memberId: string,
    field: "contactEmail" | "contactPhone",
    value: string
  ) {
    setFamilyMembers((current) =>
      current.map((member) =>
        member.id === memberId ? { ...member, [field]: value } : member
      )
    );
  }

  function toggleWeddingAttendance(memberId: string) {
    setFamilyMembers((current) =>
      current.map((member) => {
        if (member.id !== memberId) return member;

        const nextAttendingWedding = !member.attendingWedding;

        return {
          ...member,
          attendingWedding: nextAttendingWedding,
          attendingChurch: nextAttendingWedding ? member.attendingChurch : false,
          unableToAttend: nextAttendingWedding ? false : member.unableToAttend,
        };
      })
    );
  }

  function toggleUnableToAttend(memberId: string) {
    setFamilyMembers((current) =>
      current.map((member) => {
        if (member.id !== memberId) return member;

        const nextUnableToAttend = !member.unableToAttend;

        return {
          ...member,
          unableToAttend: nextUnableToAttend,
          attendingWedding: nextUnableToAttend ? false : member.attendingWedding,
          attendingChurch: nextUnableToAttend ? false : member.attendingChurch,
        };
      })
    );
  }

  async function submitMemberRsvp(member: FamilyMember) {
    if (!family) {
      setErrorMessage("Family details are missing. Please search again.");
      return;
    }

    if (!member.contactPhone.trim()) {
      setErrorMessage(`Please enter a cellphone number for ${member.fullName}.`);
      return;
    }

    setErrorMessage("");

    try {
      const memberPayload = {
        ...member,
        attendingChurch: false,
      };

      const response = await fetch("/api/rsvp/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          familyId: family.id,
          members: [memberPayload],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.error ?? "Could not submit RSVP. Please try again."
        );
        return;
      }

      if (member.unableToAttend) {
        const declinedResponse = await fetch("/api/rsvp/decline", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            familyId: family.id,
            surname: family.surname,
            guestGroup: family.guestGroup,
            members: [memberPayload],
          }),
        });

        const declinedData = await declinedResponse.json();

        if (!declinedResponse.ok) {
          setErrorMessage(
            declinedData.error ??
              "RSVP was saved, but we could not save the unable to attend response. Please try again."
          );
          return;
        }
      }

      setStep("success");
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not submit RSVP. Please try again.");
    }
  }

  return (
    <ModalShell open={open} onClose={onClose}>
      <AnimatePresence mode="wait">
        {step === "surname" && (
          <motion.form
            key="surname"
            onSubmit={handleSurnameSubmit}
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, filter: "blur(8px)" }}
            transition={{ duration: 0.35 }}
          >
            <p className="mb-2 text-[0.65rem] uppercase tracking-[0.34em] text-[#9c8261] sm:mb-3 sm:text-xs sm:tracking-[0.42em]">
              Wedding RSVP
            </p>

            <h2
              className={`${playfair.className} mb-3 text-3xl font-black text-[#243b5a] sm:mb-4 sm:text-5xl`}
            >
              Welcome
            </h2>

            <p className="mx-auto mb-5 max-w-sm text-sm leading-6 text-[#4d5f78] sm:mb-8 sm:text-base sm:leading-7">
              Please enter your family surname so we can find your invitation.
            </p>

            <div className="mx-auto mb-5 max-w-md rounded-[1.4rem] border border-[#c9a76b]/35 bg-[#fff8ed]/70 p-2 shadow-[0_14px_42px_rgba(36,59,90,0.08)]">
              <div className="relative grid grid-cols-2 overflow-hidden rounded-full bg-[#f8efe2]/80 p-1">
                <motion.div
                  className="absolute bottom-1 top-1 rounded-full bg-[#243b5a] shadow-[0_14px_34px_rgba(36,59,90,0.18)]"
                  initial={false}
                  animate={{
                    left: selectedGuestGroup === "bride-groom" ? "0.25rem" : "50%",
                    right:
                      selectedGuestGroup === "bride-groom" ? "50%" : "0.25rem",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 28,
                    mass: 0.7,
                  }}
                />

                {[
                  {
                    value: "bride-groom" as const,
                    label: "Guest of Bride & Groom",
                  },
                  {
                    value: "parents" as const,
                    label: "Guest of Parents",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedGuestGroup(option.value)}
                    className={`${playfair.className} relative z-10 rounded-full px-2 py-3 text-[0.54rem] font-black uppercase tracking-[0.12em] transition-colors duration-300 sm:px-3 sm:text-[0.68rem] sm:tracking-[0.16em] ${
                      selectedGuestGroup === option.value
                        ? "text-[#fff8ed]"
                        : "text-[#9c8261] hover:text-[#243b5a]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <input
              value={surname}
              onChange={(event) => setSurname(event.target.value)}
              placeholder="Enter surname"
              className={`${playfair.className} mb-4 w-full rounded-full border border-[#c9a76b]/45 bg-[#fff8ed] px-5 py-3.5 text-center text-lg font-bold text-[#243b5a] outline-none shadow-inner placeholder:text-[#9c8261]/55 focus:border-[#b88a3d] sm:px-6 sm:py-4 sm:text-xl`}
            />

            {errorMessage && (
              <p className="mx-auto mb-4 max-w-sm text-sm font-bold text-[#b91c1c]">
                {errorMessage}
              </p>
            )}

            {suggestions.length > 0 && (
              <div className="mx-auto mb-5 max-w-md space-y-2 rounded-[1.4rem] border border-[#c9a76b]/35 bg-[#fff8ed]/75 p-4 text-left shadow-[0_16px_50px_rgba(36,59,90,0.08)]">
                <p className="text-center text-[0.65rem] font-black uppercase tracking-[0.26em] text-[#9c8261]">
                  Did you mean?
                </p>

                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => searchInvitation(suggestion.surname)}
                    className="w-full rounded-2xl border border-[#c9a76b]/30 bg-[#f8efe2]/80 px-4 py-3 text-left transition hover:border-[#b88a3d] hover:bg-[#fff8ed]"
                  >
                    <span
                      className={`${playfair.className} block text-base font-black text-[#243b5a]`}
                    >
                      {suggestion.surname}
                    </span>

                    {suggestion.membersPreview.length > 0 && (
                      <span className="mt-1 block text-xs leading-5 text-[#6f7f96]">
                        {suggestion.membersPreview.join(", ")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <motion.button
              type="submit"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`${playfair.className} rounded-full border-2 border-[#c9a76b] bg-[#243b5a] px-9 py-3.5 text-xs font-black uppercase tracking-[0.28em] text-[#fff8ed] shadow-[0_22px_70px_rgba(36,59,90,0.22)] sm:px-10 sm:py-4 sm:text-sm sm:tracking-[0.32em]`}
            >
              Find Invitation
            </motion.button>
          </motion.form>
        )}

        {step === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, filter: "blur(8px)" }}
            transition={{ duration: 0.35 }}
            className="py-10 sm:py-12"
          >
            <h2
              className={`${playfair.className} mb-8 text-2xl font-black text-[#243b5a] sm:text-4xl`}
            >
              Finding your invitation...
            </h2>

            <div className="mx-auto h-3 max-w-sm overflow-hidden rounded-full bg-[#d8c3a5]/35">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#b88a3d] via-[#e2c27d] to-[#b88a3d]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        )}

        {step === "family" && family && (
          <motion.div
            key="family"
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, filter: "blur(8px)" }}
            transition={{ duration: 0.35 }}
          >
            <p className="mb-2 text-[0.62rem] uppercase tracking-[0.32em] text-[#9c8261] sm:mb-3 sm:text-xs sm:tracking-[0.42em]">
              {family.surname} Family
            </p>

            <h2
              className={`${playfair.className} mb-4 text-2xl font-black text-[#243b5a] sm:mb-5 sm:text-4xl`}
            >
              Please confirm attendance
            </h2>

            <div className="mb-4 rounded-[1.4rem] border border-[#c9a76b]/35 bg-[#fff8ed]/75 p-4 text-center shadow-[0_16px_50px_rgba(36,59,90,0.08)]">
              <p className="text-xs uppercase tracking-[0.24em] text-[#9c8261]">
                Contact details
              </p>

              <p className="mt-2 text-sm leading-6 text-[#4d5f78]">
                Please add an email address and cellphone number for each invited
                guest so we can send wedding updates directly to everyone.
              </p>
            </div>

            <div className="mb-4 space-y-3 text-left">
              {familyMembers.map((member) => (
                <div
                  key={member.id}
                  className="rounded-2xl border border-[#c9a76b]/30 bg-[#fff8ed]/75 px-4 py-3 shadow-[0_12px_40px_rgba(36,59,90,0.08)]"
                >
                  <p
                    className={`${playfair.className} mb-3 text-lg font-black text-[#243b5a]`}
                  >
                    {member.fullName}
                  </p>

                  <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      type="email"
                      value={member.contactEmail}
                      onChange={(event) =>
                        updateMemberContact(
                          member.id,
                          "contactEmail",
                          event.target.value
                        )
                      }
                      placeholder="Email address"
                      className={`${playfair.className} w-full rounded-full border border-[#c9a76b]/40 bg-[#fff8ed] px-4 py-2.5 text-center text-sm font-bold text-[#243b5a] outline-none placeholder:text-[#9c8261]/50 focus:border-[#b88a3d]`}
                    />

                    <input
                      type="tel"
                      value={member.contactPhone}
                      onChange={(event) =>
                        updateMemberContact(
                          member.id,
                          "contactPhone",
                          event.target.value
                        )
                      }
                      placeholder="Cellphone number"
                      className={`${playfair.className} w-full rounded-full border border-[#c9a76b]/40 bg-[#fff8ed] px-4 py-2.5 text-center text-sm font-bold text-[#243b5a] outline-none placeholder:text-[#9c8261]/50 focus:border-[#b88a3d]`}
                    />
                  </div>

                  <label
                    className={`mb-2 flex cursor-pointer items-center gap-3 rounded-full border px-4 py-2.5 ${
                      member.unableToAttend
                        ? "border-[#b91c1c]/35 bg-[#fff1ed]"
                        : "border-[#c9a76b]/35 bg-[#f8efe2]/80"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={member.unableToAttend}
                      onChange={() => toggleUnableToAttend(member.id)}
                      className="h-4 w-4 accent-[#b91c1c]"
                    />

                    <span className="text-sm font-bold text-[#4d5f78]">
                      Regretfully unable to attend
                    </span>
                  </label>

                  <div className="grid grid-cols-1 gap-2">
                    <label
                      className={`flex items-center gap-3 rounded-full border px-4 py-2.5 ${
                        member.unableToAttend
                          ? "cursor-not-allowed border-[#c9a76b]/20 bg-[#f8efe2]/35 opacity-45"
                          : "cursor-pointer border-[#c9a76b]/35 bg-[#f8efe2]/80"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={member.attendingWedding}
                        disabled={member.unableToAttend}
                        onChange={() => toggleWeddingAttendance(member.id)}
                        className="h-4 w-4 accent-[#b88a3d]"
                      />

                      <span className="text-sm font-bold text-[#4d5f78]">
                        Wedding Reception
                      </span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => submitMemberRsvp(member)}
                    className={`${playfair.className} mt-3 w-full rounded-full border border-[#c9a76b] bg-[#243b5a] px-5 py-3 text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#fff8ed] shadow-[0_16px_45px_rgba(36,59,90,0.16)] transition hover:bg-[#314a6d]`}
                  >
                    Submit RSVP for {member.fullName.split(" ")[0]}
                  </button>
                </div>
              ))}
            </div>

            <div className="mb-5 rounded-[1.4rem] border border-[#c9a76b]/40 bg-[#fff8ed]/75 p-4 text-center shadow-[0_16px_50px_rgba(36,59,90,0.08)]">
              <p className="text-xs uppercase tracking-[0.22em] text-[#9c8261]">
                RSVP Summary
              </p>

              <p className="mt-2 text-sm leading-6 text-[#4d5f78]">
                Reception attendees:{" "}
                <span className="font-black text-[#243b5a]">
                  {attendingWeddingCount}
                </span>
              </p>

              <p className="mt-2 text-[0.68rem] leading-5 text-[#6f7f96]">
                Please submit each guest's RSVP individually after confirming
                their contact details.
              </p>
            </div>

            {errorMessage && (
              <p className="mx-auto mb-4 max-w-sm text-sm font-bold text-[#b91c1c]">
                {errorMessage}
              </p>
            )}

            <p className="mx-auto mb-4 max-w-sm text-xs font-black uppercase tracking-[0.24em] text-[#9c6f2d]">
              RSVP Deadline: {RSVP_DEADLINE}
            </p>

          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, filter: "blur(8px)" }}
            transition={{ duration: 0.35 }}
            className="py-8 sm:py-10"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#c9a76b] bg-[#fff8ed] text-3xl text-[#b88a3d] shadow-[0_20px_70px_rgba(201,167,107,0.28)] sm:mb-8 sm:h-20 sm:w-20 sm:text-4xl"
            >
              ✓
            </motion.div>

            <h2
              className={`${playfair.className} mb-4 text-3xl font-black text-[#243b5a] sm:text-5xl`}
            >
              RSVP submitted
            </h2>

            <p className="text-lg text-[#4d5f78] sm:text-xl">
              Thank you. Your RSVP has been received.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalShell>
  );
}

function HeroSection() {
  const heroScrollRef = useRef<HTMLDivElement | null>(null);
  const [hoveredFrame, setHoveredFrame] = useState<string | null>(null);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [registryOpen, setRegistryOpen] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  const { scrollYProgress } = useScroll({
    target: heroScrollRef,
    offset: ["start start", "end start"],
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    mass: 0.35,
  });

  const introOpacity = useTransform(progress, [0, 0.18], [1, 0]);
  const inviteOpacity = useTransform(progress, [0, 0.18], [1, 0]);
  const dividerOpacity = useTransform(progress, [0, 0.18], [1, 0]);

  const namesY = useTransform(progress, [0, 0.42], [0, -135]);
  const namesScale = useTransform(progress, [0, 0.42], [1, 0.78]);

  const detailsY = useTransform(progress, [0, 0.42], [0, 300]);
  const detailsScale = useTransform(progress, [0, 0.42], [1, 1.08]);

  const heroTimerOpacity = useTransform(progress, [0, 0.16], [1, 0]);
  const fixedTimerOpacity = useTransform(progress, [0.18, 0.34], [0, 1]);

  const polaroidOpacity = useTransform(
    progress,
    [0.16, 0.34, 0.56, 0.66],
    [0, 1, 1, 0]
  );
  const polaroidY = useTransform(progress, [0.16, 0.42, 0.66], [90, 55, -70]);
  const polaroidScale = useTransform(
    progress,
    [0.16, 0.42, 0.66],
    [0.84, 0.9, 0.84]
  );

  const carouselOpacity = useTransform(
    progress,
    [0.58, 0.64, 0.88, 0.96],
    [0, 1, 1, 0]
  );
  const carouselX = useTransform(progress, [0.58, 0.64], ["100vw", "0vw"]);

  const rsvpOpacity = useTransform(
    progress,
    [0.64, 0.74, 0.88, 0.96],
    [0, 1, 1, 0]
  );
  const rsvpY = useTransform(progress, [0.64, 0.74], [48, 0]);
  const rsvpScale = useTransform(progress, [0.64, 0.74], [0.92, 1]);

  return (
    <>
      <AudioPlayer />

      <RegistryButton onClick={() => setRegistryOpen(true)} />
      <RegistryModal
        open={registryOpen}
        onClose={() => setRegistryOpen(false)}
      />
      <ComingSoonModal
        open={comingSoonOpen}
        onClose={() => setComingSoonOpen(false)}
      />
      <RSVPModal open={rsvpOpen} onClose={() => setRsvpOpen(false)} />

      <section className={`${cormorant.className} relative bg-[#f3e7d6]`}>
        <div ref={heroScrollRef} className="relative min-h-[340vh]">
          <motion.div
            style={{ opacity: fixedTimerOpacity }}
            className="fixed right-3 top-3 z-[100] sm:right-8 sm:top-8"
          >
            <div className="flex flex-col items-end gap-2 sm:gap-3">
              <CountdownTimer compact />
              <FloatingRSVPButton onClick={() => setRsvpOpen(true)} />
            </div>
          </motion.div>

          <div className="sticky top-0 flex min-h-screen items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#fbf3e8_0%,#f3e7d6_42%,#d9e5f2_100%)]" />
            <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#b9cce2]/40 blur-3xl" />
            <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-[#d8c3a5]/50 blur-3xl" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#d9e5f2]/40 to-transparent" />

            <FloatingDust />

            <motion.div
              style={{ opacity: carouselOpacity, x: carouselX }}
              className="fixed left-0 right-0 top-1/2 z-30 h-[320px] w-[100dvw] max-w-none -translate-y-1/2 overflow-hidden sm:h-[430px] md:h-[460px]"
            >
              <ImageCarousel />
            </motion.div>

            <motion.div
              style={{ opacity: rsvpOpacity, y: rsvpY, scale: rsvpScale }}
              className="fixed bottom-[132px] left-1/2 z-[80] -translate-x-1/2 sm:bottom-[155px]"
            >
              <RSVPButton onClick={() => setRsvpOpen(true)} />
            </motion.div>

            <div className="relative z-40 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-4 text-center sm:px-6">
              <motion.p
                style={{ opacity: introOpacity }}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="mb-4 text-[0.56rem] uppercase tracking-[0.32em] text-[#5f6f86] sm:mb-6 sm:text-xs sm:tracking-[0.5em]"
              >
                Together With Their Families
              </motion.p>

              <motion.div
                style={{ y: namesY, scale: namesScale }}
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2 }}
                className="relative z-[90] origin-center"
              >
                <h1
                  className={`${dancingScript.className} text-[3.35rem] font-semibold leading-[1.16] tracking-normal min-[390px]:text-[3.85rem] sm:text-8xl md:text-9xl`}
                >
                  <span className="luxury-name-glow text-[#243b5a]">
                    Joseph
                    <span className="mx-2 text-[#9c8261] sm:mx-4">&</span>
                    Taiwo
                  </span>
                </h1>
              </motion.div>

              <motion.div
                style={{ opacity: dividerOpacity }}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 1.2, delay: 0.35 }}
                className="mt-5 h-px w-36 origin-center bg-gradient-to-r from-transparent via-[#c9a76b] to-transparent sm:mt-7 sm:w-48"
              />

              <motion.p
                style={{ opacity: inviteOpacity }}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.45 }}
                className="mt-6 text-lg font-medium text-[#4d5f78] sm:mt-8 sm:text-2xl md:text-3xl"
              >
                Invite you to celebrate their wedding
              </motion.p>

              <motion.div
                style={{
                  opacity: polaroidOpacity,
                  y: polaroidY,
                  scale: polaroidScale,
                }}
                className="absolute left-1/2 top-[58%] z-50 -translate-x-1/2 -translate-y-1/2 sm:top-[55%] md:top-[54%]"
              >
                <PolaroidFrames
                  hoveredFrame={hoveredFrame}
                  setHoveredFrame={setHoveredFrame}
                />
              </motion.div>

              <motion.div
                style={{ y: detailsY, scale: detailsScale }}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.55 }}
                className="mt-5 flex origin-center flex-col items-center gap-2 sm:gap-3"
              >
                <p className={`${playfair.className} text-sm font-black uppercase tracking-[0.34em] text-[#314a6d] sm:text-xl sm:tracking-[0.5em] md:text-3xl`}>
                  12 December 2026
                </p>

                <p className="max-w-[92vw] text-sm tracking-[0.1em] text-[#243b5a] min-[390px]:text-base sm:text-xl sm:tracking-[0.2em] md:text-3xl">
                  St Hilda Parish Church × Silver Lakes Farm Hotel · Pretoria
                </p>

                <div className="mt-3 flex items-center gap-3 text-[#c9a76b] sm:mt-5 sm:gap-4">
                  <span className="h-px w-12 bg-[#c9a76b]/60 sm:w-20" />
                  <span className="text-lg sm:text-xl">❦</span>
                  <span className="h-px w-12 bg-[#c9a76b]/60 sm:w-20" />
                </div>
              </motion.div>

              <motion.div
                style={{ opacity: heroTimerOpacity }}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.75 }}
                className="flex flex-col items-center"
              >
                <CountdownTimer />
                <ScrollDownArrow />
              </motion.div>
            </div>
          </div>
        </div>

        <section className="relative z-50 bg-[#f3e7d6] px-4 pb-10 pt-8 sm:pt-14">
          <DressCodeSection />
        </section>

        <section className="relative z-50 bg-[#f3e7d6] px-4 py-12 sm:py-20">
          <OrderOfDaySection />
        </section>

        <section className="relative z-50 bg-[#f3e7d6]">
          <EventActionButtons onComingSoon={() => setComingSoonOpen(true)} />
        </section>
      </section>
    </>
  );
}

export default function Home() {
  return <HeroSection />;
}