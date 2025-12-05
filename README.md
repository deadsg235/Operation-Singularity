# Operation Singularity - Fast-Paced Gory FPS

A brutal, fast-paced first-person shooter built with React, Three.js, and Next.js featuring punchy gunplay, gore effects, and AI enemies.

## Features

### 🔫 Punchy Gunplay
- **Full-auto firing** - Hold mouse button for continuous fire
- **Realistic recoil** - Screen shake and weapon kick
- **Muzzle flash effects** - Dynamic lighting and particle effects
- **Satisfying audio** - Synthetic gunshot sounds with punch
- **Auto-reload system** - Automatic magazine reload when empty

### 🩸 Gore System
- **Blood splatter particles** - Physics-based blood effects
- **Dynamic gore** - Particles react to surface normals
- **Persistent blood** - Blood effects linger in the environment
- **Screen effects** - Damage flash and screen shake

### 🤖 Advanced AI Enemies
- **Smart AI behavior** - Patrol, chase, and attack states
- **Difficulty scaling** - Enemies get stronger as score increases
- **Health systems** - Visual health bars and damage feedback
- **Death animations** - Satisfying enemy destruction effects
- **Glowing eyes** - Menacing visual design

### 🎮 Game Mechanics
- **WASD movement** - Smooth first-person controls
- **Mouse look** - Pointer lock controls for immersive gameplay
- **Health & Shield** - Dual-layer protection system
- **Score system** - Points for enemy kills
- **Wave spawning** - Continuous enemy reinforcements

## Controls

- **Mouse** - Look around
- **Left Click** - Shoot (hold for full-auto)
- **W/A/S/D** - Move
- **ESC** - Unlock mouse cursor

## Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   Navigate to `http://localhost:3000/fps`

4. **Start playing:**
   Click "ENGAGE: AI REBELLION" to lock cursor and begin

## Game Tips

- **Aim for headshots** - More satisfying gore effects
- **Keep moving** - Enemies are aggressive and will swarm you
- **Watch your ammo** - Auto-reload takes time, plan accordingly
- **Use cover** - Crates provide tactical positioning
- **Monitor health** - Shield regenerates, health does not

## Technical Features

- **React Three Fiber** - Declarative 3D rendering
- **Advanced particle systems** - Custom blood and muzzle flash effects
- **Synthetic audio** - Web Audio API for punchy sound effects
- **Performance optimized** - Efficient rendering and cleanup
- **Responsive design** - Scales to different screen sizes

## Architecture

```
app/
├── fps/page.tsx           # Main game component
├── components/
│   ├── SoundSystem.tsx    # Audio effects system
│   ├── GoreSystem.tsx     # Blood and particle effects
│   └── EnemyAI.tsx        # Advanced enemy behaviors
└── layout.tsx             # App layout
```

## Customization

### Difficulty Tuning
Edit constants in `page.tsx`:
```typescript
const ENEMY = {
  speed: 0.04,        // Enemy movement speed
  damage: 15,         // Damage per hit
  spawnRate: 2000,    // Milliseconds between spawns
};

const GUN = {
  fireCooldown: 80,   // Milliseconds between shots
  damage: 35,         // Damage per shot
  recoil: 0.04,       // Screen shake intensity
};
```

### Visual Effects
Adjust gore intensity in `GoreSystem.tsx`:
```typescript
intensity={25}  // Number of blood particles
```

## Performance Notes

- Blood particles are automatically cleaned up after 3 seconds
- Enemy count is capped at 10 simultaneous enemies
- Particle systems use efficient BufferGeometry
- Audio uses Web Audio API for low-latency sound

## Browser Compatibility

- **Chrome/Edge** - Full support
- **Firefox** - Full support
- **Safari** - Limited audio support (Web Audio API restrictions)

## Future Enhancements

- [ ] Weapon variety (shotgun, rifle, etc.)
- [ ] Power-ups and upgrades
- [ ] Multiplayer support
- [ ] Level progression
- [ ] Boss enemies
- [ ] Weapon customization

---

**Warning:** This game contains intense violence and gore effects. Suitable for mature audiences only.