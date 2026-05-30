// *********************
// Role of the component: Section title that can be used on any page
// Name of the component: SectionTitle.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <SectionTitle />
// Input parameters: {title: string; path: string}
// Output: div containing h1 for page title and p for page location path 
// *********************

import React from 'react'

const SectionTitle = ({title, path} : {title: string; path: string}) => {
  return (
    <div className='mb-2 min-h-[220px] border-b border-[var(--site-border)] bg-[var(--site-panel)] px-4 pt-14 max-md:min-h-[180px] max-md:pt-10 max-sm:min-h-[140px] max-sm:pt-8'>
        <h1 className='section-title-title mb-5 text-center text-6xl font-black uppercase leading-tight text-[var(--site-text)] max-md:text-4xl max-sm:mb-2 max-sm:text-3xl'>{ title }</h1>
        <p className='section-title-path text-center text-lg text-[var(--site-muted)] max-sm:text-sm'>{ path }</p>
    </div>
  )
}

export default SectionTitle
