<template>
  <section class="about">
    <h1>About this project</h1>
    <p>
      Light Scheduler is a reference frontend built to demonstrate a production-grade toolchain
      rather than a finished product.
    </p>

    <ul>
      <li>
        <strong>Vue 3</strong> with the Composition API and <code>&lt;script setup&gt;</code>.
      </li>
      <li><strong>Vite</strong> for instant dev server startup and optimized production builds.</li>
      <li><strong>TypeScript</strong> for compile-time safety across components and stores.</li>
      <li><strong>Pinia</strong> for predictable, testable state management.</li>
      <li><strong>Vitest</strong> and <strong>@vue/test-utils</strong> for fast unit tests.</li>
      <li>
        <strong>GitHub Actions</strong> to lint, type-check, test, build, and deploy on every push.
      </li>
    </ul>
  </section>
</template>

<style scoped>
.about {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.about h1 {
  margin: 0;
  font-size: 1.75rem;
}

.about p {
  margin: 0;
  color: var(--color-muted);
}

.about ul {
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: var(--color-text);
}

.about code {
  background: var(--color-surface-alt);
  padding: 0.1rem 0.35rem;
  border-radius: var(--radius-sm);
  font-size: 0.9em;
}
</style>
