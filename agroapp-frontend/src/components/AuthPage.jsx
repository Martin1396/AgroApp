import LoginForm from './LoginForm'

import PageBackground from './PageBackground'

import BrandHeader from './BrandHeader'

import BrandFooter from './BrandFooter'

import './AuthPage.css'



export default function AuthPage({ onAuthSuccess }) {

  return (

    <div className="auth-page">

      <PageBackground gradientId="goldBandAuth" />



      <div className="auth-page__inner">

        <BrandHeader variant="auth" className="auth-page__header" />



        <main className="auth-card">

          <LoginForm onSuccess={onAuthSuccess} />

        </main>



        <BrandFooter className="auth-footer" />

      </div>

    </div>

  )

}


