<script setup lang="ts">
import { domAnimation } from 'motion-v'
import { LazyMotion } from 'motion-v'
</script>

<template>
  <LazyMotion :features="domAnimation" :strict="true">
    <router-view />
  </LazyMotion>
</template>