# SalonQ — Three-Minute Demonstration Script

**Project:** SalonQ — Smart Salon Queue Management  
**Target Duration:** Exactly 3 minutes (180 seconds)  
**Audience:** College Assignment Evaluator / Professor  

---

### Introduction & Problem Statement (0:00 – 0:30)

> *"Good afternoon, Professor. Today I am presenting **SalonQ — Smart Salon Queue Management**, with our guiding motto: 'Your Time. Your Turn.'*
>
> *Traditional salons suffer from crowded waiting areas, uncertain wait times, and customer anxiety. Customers often leave or don't return simply because they cannot see where they stand in line.*
>
> *SalonQ solves this by providing a unified, real-time queue management system with seven thoughtfully designed screens. It gives customers the freedom to join remotely or walk in, track their progress privately on their own mobile devices, and see their turns called on a beautiful waiting area display, while giving salon staff and owners complete operational control."*

---

### Customer Admission & Private Queue Tracking (0:30 – 1:05)

> *"Let's start from the customer perspective. On the Home screen (`/`), a customer sees live salon availability, current opening hours in IST, and an estimated wait time.*
>
> *Clicking 'Join queue' (`/join`), the customer enters their name, 10-digit Indian mobile number, and selects up to three services — for example, a Haircut and Beard sculpt. They can choose a preferred barber or select 'Any barber' for the earliest available chair.*
>
> *Upon confirmation, the backend generates a unique token — like S-042 — and an opaque 64-character private capability key. Notice that no customer account is required. The customer's status page (`/status/:id`) updates in real time, showing their exact queue position and an arrival notification when they reach position two."*

---

### Reception Dashboard & Realtime Call Next (1:05 – 1:40)

> *"Now let's view the salon team's perspective. The receptionist signs in securely at `/login` and is directed to the Reception Dashboard (`/reception`).*
>
> *Here, the receptionist sees live barber availability cards, active chair assignments, and the ordered queue. If a walk-in arrives at the door, the receptionist clicks 'Add walk-in' to admit them directly into the queue.*
>
> *When barber Ravi is available, the receptionist clicks 'Call next'. The Supabase database transaction atomically reserves the earliest eligible customer matching Ravi's preference, assigns token S-042, and records the server timestamp.*
>
> *Immediately, through PostgreSQL realtime change signals, the customer's phone switches to 'Called', showing 'Please proceed to Ravi'."*

---

### Waiting Area TV & Barber Workspace (1:40 – 2:20)

> *"Simultaneously, the Waiting Area TV display (`/display` or `/tv`) updates instantly. Ravi's station card turns to 'Called' with token S-042, the token pulses in champagne gold, and a 2-tone melodic chime plays for the room. Notice that for complete customer privacy, zero customer names or phone numbers ever appear on the public screen.*
>
> *Now let's switch to Ravi's workspace (`/barber/ravi`). Ravi sees only his own assigned customer. When the customer sits in his chair, Ravi clicks 'Start service'. The elapsed timer starts counting from the server timestamp.*
>
> *When the haircut is finished, Ravi clicks 'Mark as done', confirms the dialog, and his station immediately becomes available for the next customer."*

---

### Owner Settings, Bilingual Support & Tech Stack (2:20 – 3:00)

> *"Finally, the salon owner logs in and accesses Owner Settings (`/admin`). The owner sees real-time daily metrics computed strictly for today in IST: customers served, average wait time from join to call, and no-shows.*
>
> *The owner can toggle the online queue on or off with confirmation, adjust daily opening hours, manage the service catalog with rupee pricing and duration, and manage team duty and breaks.*
>
> *Throughout every single screen, clicking the language toggle instantly translates all labels and validation messages into Gujarati with zero layout clipping.*
>
> *Under the hood, SalonQ is built with React 19, TypeScript, Tailwind CSS, Vite with optimized code splitting, and Supabase PostgreSQL with strict Row-Level Security and private schema authorization facades.*
>
> *Thank you for your time. SalonQ is fully operational and ready for your evaluation."*

