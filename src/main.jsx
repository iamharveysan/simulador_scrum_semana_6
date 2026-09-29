import React, {useMemo, useState} from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import './styles.css';

const scenarios = [
  {
    id: 1,
    phase: 'SPRINT REVIEW',
    title: 'El incremento funciona, pero el stakeholder pide algo nuevo',
    context: 'El dashboard de avance de obra ya permite consultar porcentaje real y fotografías. En la Review, gerencia pide comparar avance real vs. programado.',
    question: '¿Qué debería hacer el equipo?',
    options: [
      {text:'Agregar inmediatamente la nueva funcionalidad al incremento ya cerrado.', score:0, feedback:'La Review no reabre automáticamente el Sprint terminado.'},
      {text:'Registrar el feedback, incorporarlo al Product Backlog y revisarlo en la siguiente priorización.', score:3, feedback:'Correcto. La Review genera información para adaptar el Product Backlog.'},
      {text:'Ignorar la solicitud porque no estaba contemplada en el Sprint.', score:0, feedback:'El feedback del stakeholder es precisamente uno de los insumos de la Review.'}
    ]
  },
  {
    id: 2,
    phase: 'SPRINT REVIEW',
    title: 'El cliente está satisfecho… pero los datos muestran otra cosa',
    context: 'El cliente dice que el dashboard se ve bien, pero las métricas indican que tarda demasiado en cargar en obra.',
    question: '¿Qué información pesa más para decidir el siguiente paso?',
    options: [
      {text:'Solo la opinión del cliente, porque es quien recibe el producto.', score:1, feedback:'La opinión importa, pero Scrum trabaja con evidencia diversa.'},
      {text:'Combinar feedback del cliente con datos de uso y desempeño.', score:3, feedback:'Correcto. La inspección debe combinar percepción y evidencia.'},
      {text:'Solo las métricas técnicas, porque son objetivas.', score:1, feedback:'Los datos técnicos no sustituyen el valor percibido por usuarios y stakeholders.'}
    ]
  },
  {
    id: 3,
    phase: 'SPRINT REVIEW',
    title: 'La Review se convierte en una presentación de diapositivas',
    context: 'El equipo dedica 40 minutos a explicar lo que hizo. Los stakeholders casi no interactúan.',
    question: '¿Cuál sería la mejor mejora?',
    options: [
      {text:'Mantener la presentación y enviar las preguntas después por correo.', score:0, feedback:'Eso reduce la colaboración y el aprendizaje en tiempo real.'},
      {text:'Reducir la exposición y dedicar más tiempo a inspeccionar el incremento y conversar sobre el futuro.', score:3, feedback:'Correcto. La Review debe ser una sesión de trabajo, no solo una demo.'},
      {text:'Eliminar a los stakeholders y hacer la Review solo con el Scrum Team.', score:0, feedback:'Los stakeholders relevantes son una fuente clave de feedback.'}
    ]
  },
  {
    id: 4,
    phase: 'RETROSPECTIVE',
    title: 'El mismo bloqueo apareció en tres Sprints',
    context: 'Los datos de un proveedor externo vuelven a llegar tarde. Ya ocurrió tres veces.',
    question: '¿Qué debería producir la Retrospective?',
    options: [
      {text:'Una frase general: “debemos comunicarnos mejor”.', score:0, feedback:'Es demasiado abstracto y difícil de verificar.'},
      {text:'Una acción concreta: validar disponibilidad de datos antes del Sprint Planning y definir responsable de seguimiento.', score:3, feedback:'Correcto. La mejora debe ser observable y verificable.'},
      {text:'Buscar quién fue responsable del retraso y dejar constancia.', score:0, feedback:'La Retrospective no existe para buscar culpables.'}
    ]
  },
  {
    id: 5,
    phase: 'RETROSPECTIVE',
    title: 'Demasiadas tareas abiertas al mismo tiempo',
    context: 'El equipo tuvo 9 tareas “En proceso” simultáneamente y terminó pocas durante la primera mitad del Sprint.',
    question: '¿Qué aprendizaje es más útil?',
    options: [
      {text:'Abrir más tareas para recuperar velocidad.', score:0, feedback:'Eso suele aumentar el WIP y empeorar el flujo.'},
      {text:'Probar un límite de trabajo en proceso y terminar antes de iniciar nuevas tareas.', score:3, feedback:'Correcto. Es una mejora concreta del sistema de trabajo.'},
      {text:'Asignar todas las tareas al integrante más rápido.', score:0, feedback:'Eso destruye autogestión y genera dependencia.'}
    ]
  },
  {
    id: 6,
    phase: 'RETROSPECTIVE',
    title: 'Trabajo marcado Done volvió a desarrollo',
    context: 'Tres historias regresaron porque los permisos no fueron probados correctamente.',
    question: '¿Qué debería revisar el equipo?',
    options: [
      {text:'La Definition of Done.', score:3, feedback:'Correcto. Puede ser necesario ampliar los criterios de calidad.'},
      {text:'El Product Goal.', score:1, feedback:'El Product Goal no define condiciones de calidad de cada incremento.'},
      {text:'Eliminar las pruebas para acelerar el siguiente Sprint.', score:0, feedback:'Eso aumentaría el riesgo de retrabajo.'}
    ]
  },
  {
    id: 7,
    phase: 'GESTIÓN DEL CONOCIMIENTO',
    title: 'El equipo aprendió algo importante',
    context: 'Descubrieron que una dependencia crítica debe validarse antes de comprometer una historia.',
    question: '¿Cómo se convierte ese aprendizaje en conocimiento útil?',
    options: [
      {text:'Comentándolo informalmente al final de la reunión.', score:1, feedback:'Puede perderse si no se convierte en práctica observable.'},
      {text:'Transformándolo en una acción concreta y verificable para el siguiente Sprint.', score:3, feedback:'Correcto. El aprendizaje se vuelve parte del sistema de trabajo.'},
      {text:'Esperando a que vuelva a ocurrir para confirmar.', score:0, feedback:'Eso desperdicia un aprendizaje ya identificado.'}
    ]
  },
  {
    id: 8,
    phase: 'IA APLICADA',
    title: 'La IA detecta un patrón de retrasos',
    context: 'Un copiloto de IA indica que la mayoría de bloqueos provienen de dependencias externas.',
    question: '¿Qué debería hacer el equipo con esa conclusión?',
    options: [
      {text:'Aplicarla automáticamente como verdad.', score:0, feedback:'La IA puede detectar señales, pero no reemplaza el juicio del equipo.'},
      {text:'Usarla como hipótesis y contrastarla con evidencia del Sprint.', score:3, feedback:'Correcto. La IA apoya la inspección; el equipo interpreta y decide.'},
      {text:'Ignorarla porque la IA no participa en Scrum.', score:1, feedback:'Puede ser una herramienta útil si se usa con criterio.'}
    ]
  }
];

function App(){
  const [stage,setStage]=useState('register');
  const [user,setUser]=useState({name:'',lastName:'',career:''});
  const [index,setIndex]=useState(0);
  const [answers,setAnswers]=useState([]);
  const [selected,setSelected]=useState(null);

  const total = scenarios.reduce((a,s)=>a+Math.max(...s.options.map(o=>o.score)),0);
  const score = answers.reduce((a,b)=>a+b.score,0);
  const percent = Math.round(score/total*100);

  const result = useMemo(()=>{
    if(percent>=90) return {label:'Dominio sobresaliente', text:'Tienes una lectura muy sólida de Review, Retrospective y mejora continua.'};
    if(percent>=75) return {label:'Buen dominio', text:'Comprendes bien la lógica de cierre del Sprint y tomas decisiones consistentes.'};
    if(percent>=60) return {label:'En desarrollo', text:'Tienes una base adecuada, pero algunas decisiones todavía mezclan producto, proceso y control.'};
    return {label:'Requiere refuerzo', text:'Conviene repasar la diferencia entre Review, Retrospective y mejora basada en evidencia.'};
  },[percent]);

  function start(){
    if(!user.name.trim()||!user.lastName.trim()||!user.career.trim()){
      alert('Completa nombre, apellido y carrera.');
      return;
    }
    setStage('intro');
  }

  function beginSimulation(){setStage('simulation')}

  function choose(optIndex){
    if(selected!==null) return;
    setSelected(optIndex);
  }

  function next(){
    const sc=scenarios[index];
    const opt=sc.options[selected];
    setAnswers(a=>[...a,{scenario:sc.id,score:opt.score,choice:opt.text}]);
    setSelected(null);
    if(index===scenarios.length-1) setStage('result');
    else setIndex(i=>i+1);
  }

  function reset(){
    setStage('register');setUser({name:'',lastName:'',career:''});setIndex(0);setAnswers([]);setSelected(null);
  }

  function certificate(){
    const doc = new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
    doc.setFillColor(245,243,235); doc.rect(0,0,297,210,'F');
    doc.setDrawColor(18,18,18); doc.setLineWidth(1); doc.rect(10,10,277,190);
    doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.text('SCRUM / WEEK 06',20,27);
    doc.setFontSize(32); doc.text('CERTIFICADO DE PARTICIPACIÓN',148.5,57,{align:'center'});
    doc.setFont('helvetica','normal'); doc.setFontSize(14); doc.text('Se certifica que',148.5,78,{align:'center'});
    doc.setFont('helvetica','bold'); doc.setFontSize(28); doc.text(`${user.name} ${user.lastName}`,148.5,97,{align:'center'});
    doc.setFont('helvetica','normal'); doc.setFontSize(13);
    doc.text(`Programa / carrera: ${user.career}`,148.5,111,{align:'center'});
    doc.text('completó el simulador Review & Retrospective Lab',148.5,126,{align:'center'});
    doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.text(`Resultado: ${percent}% · ${result.label}`,148.5,143,{align:'center'});
    doc.setFont('helvetica','normal'); doc.setFontSize(11);
    doc.text('Sprint Review · Sprint Retrospective · Mejora continua · Gestión del conocimiento',148.5,160,{align:'center'});
    doc.setFillColor(216,255,62); doc.rect(20,177,257,5,'F');
    doc.setFontSize(9); doc.text('Simulador académico de Scrum',20,191);
    doc.text(new Date().toLocaleDateString('es-CO'),277,191,{align:'right'});
    doc.save(`Certificado_${user.name}_${user.lastName}_Scrum_Week6.pdf`);
  }

  return <div className="app">
    <AnimatePresence mode="wait">
      {stage==='register' && <motion.section className="screen register" key="register" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
        <div className="register-grid">
          <div className="intro-side">
            <div className="eyebrow">SCRUM / WEEK 06</div>
            <h1>REVIEW<br/>& RETRO<br/><span>LAB</span></h1>
            <p>No vas a responder definiciones. Vas a tomar decisiones frente a situaciones reales de cierre de Sprint.</p>
            <div className="mini-line"></div>
            <p className="small">Producto · Feedback · Calidad · Aprendizaje · Mejora continua</p>
          </div>
          <div className="form-card">
            <div className="step-label">Registro de participante</div>
            <h2>Antes de entrar al laboratorio.</h2>
            <label>Nombre<input value={user.name} onChange={e=>setUser({...user,name:e.target.value})} placeholder="Nombre"/></label>
            <label>Apellido<input value={user.lastName} onChange={e=>setUser({...user,lastName:e.target.value})} placeholder="Apellido"/></label>
            <label>Carrera que cursa<input value={user.career} onChange={e=>setUser({...user,career:e.target.value})} placeholder="Ej. Administración de Empresas"/></label>
            <button className="primary" onClick={start}>Ingresar al simulador →</button>
          </div>
        </div>
      </motion.section>}

      {stage==='intro' && <motion.section className="screen briefing" key="intro" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}>
        <div className="briefing-wrap">
          <div className="eyebrow">Briefing del Sprint</div>
          <h2>El Sprint terminó. El aprendizaje empieza ahora.</h2>
          <div className="brief-grid">
            <div><span>Proyecto</span><strong>Dashboard de seguimiento de obra</strong></div>
            <div><span>Sprint Goal</span><strong>Visualizar avance físico real del proyecto</strong></div>
            <div><span>Capacidad</span><strong>20 Story Points</strong></div>
            <div><span>Resultado</span><strong>17 SP completados</strong></div>
          </div>
          <div className="brief-note">Durante la simulación tendrás que decidir qué hacer en Sprint Review, Retrospective, gestión del conocimiento y uso de IA.</div>
          <button className="primary" onClick={beginSimulation}>Comenzar caso →</button>
        </div>
      </motion.section>}

      {stage==='simulation' && <motion.section className="screen sim" key={index} initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-40}}>
        <div className="topline">
          <div><span className="eyebrow">{scenarios[index].phase}</span><span className="counter">{index+1}/{scenarios.length}</span></div>
          <div className="progress"><i style={{width:`${(index/scenarios.length)*100}%`}}/></div>
        </div>
        <div className="sim-grid">
          <div className="scenario">
            <div className="scenario-no">0{index+1}</div>
            <h2>{scenarios[index].title}</h2>
            <p className="context">{scenarios[index].context}</p>
            <div className="question">{scenarios[index].question}</div>
          </div>
          <div className="options">
            {scenarios[index].options.map((opt,i)=><motion.button whileHover={{x:5}} className={`option ${selected===i?'selected':''}`} key={i} onClick={()=>choose(i)}>
              <span>{String.fromCharCode(65+i)}</span><b>{opt.text}</b>
            </motion.button>)}
            {selected!==null && <motion.div className={`feedback ${scenarios[index].options[selected].score===3?'good':'warn'}`} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
              {scenarios[index].options[selected].feedback}
            </motion.div>}
            <button className="primary next" disabled={selected===null} onClick={next}>{index===scenarios.length-1?'Ver resultado →':'Continuar →'}</button>
          </div>
        </div>
      </motion.section>}

      {stage==='result' && <motion.section className="screen result" key="result" initial={{opacity:0,scale:.98}} animate={{opacity:1,scale:1}}>
        <div className="result-wrap">
          <div className="eyebrow">Resultado final</div>
          <div className="score">{percent}<span>%</span></div>
          <h2>{result.label}</h2>
          <p>{result.text}</p>
          <div className="result-grid">
            <div><span>Participante</span><strong>{user.name} {user.lastName}</strong></div>
            <div><span>Carrera</span><strong>{user.career}</strong></div>
            <div><span>Decisiones</span><strong>{scenarios.length}</strong></div>
            <div><span>Puntaje</span><strong>{score}/{total}</strong></div>
          </div>
          <div className="closing">Review mejora el producto. Retrospective mejora la capacidad del equipo.</div>
          <div className="actions">
            <button className="primary" onClick={certificate}>Descargar certificado PDF</button>
            <button className="secondary" onClick={reset}>Repetir simulación</button>
          </div>
        </div>
      </motion.section>}
    </AnimatePresence>
  </div>
}

createRoot(document.getElementById('root')).render(<App />);
