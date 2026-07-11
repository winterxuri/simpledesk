import fs from "node:fs/promises";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const OUT = "C:/Users/juzzo/OneDrive/Документы/onboarding/outputs/SimpleDesk_product_deck.pptx";
const PRE = "C:/Users/juzzo/AppData/Local/Temp/codex-presentations/simpledesk-deck/preview";
const LOGO = "C:/Users/juzzo/OneDrive/Документы/onboarding/brand/simpledesk-logo-a.png";
const ICON = "C:/Users/juzzo/OneDrive/Документы/onboarding/brand/simpledesk-icon-a.png";
const W=1280,H=720, ink="#17231D", green="#2F6B4F", lime="#CDEB7B", paper="#F4F1E8", white="#FFFFFF", muted="#66736C", line="#D7DDD5", dark="#163729", peach="#E9C7A8";
const p = Presentation.create({slideSize:{width:W,height:H}});

function rect(s,x,y,w,h,fill,r=0,stroke=fill){return s.shapes.add({geometry:r?"roundRect":"rect",position:{left:x,top:y,width:w,height:h},fill,line:{style:"solid",fill:stroke,width:stroke===fill?0:1},borderRadius:r?"rounded-xl":undefined});}
function txt(s,text,x,y,w,h,size=20,color=ink,bold=false,align="left"){const q=s.shapes.add({geometry:"rect",position:{left:x,top:y,width:w,height:h},fill:"#00000000",line:{style:"solid",fill:"#00000000",width:0}});q.text=text;q.text.style={fontSize:size,color,bold,typeface:bold?"Aptos Display":"Aptos",alignment:align,verticalAlignment:"middle"};q.text.insets={left:0,right:0,top:0,bottom:0};return q;}
function rule(s,x,y,w,c=line){rect(s,x,y,w,2,c);}
function footer(s,n,darkMode=false){txt(s,"SIMPLEDESK",64,668,180,18,11,darkMode?"#AFC5B8":muted,true);txt(s,String(n).padStart(2,"0"),1160,668,56,18,11,darkMode?"#AFC5B8":muted,true,"right");}
async function img(s,path,x,y,w,h,fit="contain"){const b=await fs.readFile(path);return s.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:"image/png",alt:"SimpleDesk",fit,position:{left:x,top:y,width:w,height:h}});}
function title(s,kicker,head,sub){txt(s,kicker.toUpperCase(),64,50,500,22,13,green,true);txt(s,head,64,86,1100,90,38,ink,true);if(sub)txt(s,sub,64,176,980,52,18,muted,false);}
function chip(s,t,x,y,w,fill=white,color=ink){rect(s,x,y,w,38,fill,19);txt(s,t,x+14,y,w-28,38,14,color,true);}

// 1
{
 const s=p.slides.add();s.background.fill=paper;rect(s,0,0,22,H,green);rect(s,865,0,415,H,dark);await img(s,LOGO,64,56,250,62);
 txt(s,"Рабочая платформа\nдля малого бизнеса",64,178,690,150,54,ink,true);txt(s,"Клиенты, записи, команда, продажи и отчёты —\nв одном понятном рабочем пространстве.",66,356,650,72,22,muted);
 chip(s,"ПРОДУКТОВАЯ ПРЕЗЕНТАЦИЯ",66,486,285,lime,dark);txt(s,"От ежедневной операции — к управляемому бизнесу",900,112,300,100,24,white,true);
 for(let i=0;i<4;i++){rect(s,900,260+i*74,245,50,i===0?lime:"#234B3A",12);txt(s,["Клиенты и записи","Команда и ресурсы","Продажи и финансы","Аналитика и отчёты"][i],918,260+i*74,210,50,16,i===0?dark:white,true);}
 footer(s,1,true);
}
//2
{
 const s=p.slides.add();s.background.fill=white;title(s,"Контекст","Малый бизнес часто управляется между таблицами, чатами и памятью","");
 const items=[["01","Клиентская история теряется","Нет единой картины визитов, продаж и следующего контакта."],["02","День требует ручного контроля","Записи, задачи, смены и ресурсы живут в разных местах."],["03","Данные приходят слишком поздно","Владелец узнаёт о кассе, остатках и проблемах постфактум."]];
 items.forEach((it,i)=>{const y=242+i*120;txt(s,it[0],64,y,70,34,18,green,true);rule(s,140,y+16,72,i===1?peach:line);txt(s,it[1],238,y-4,380,42,24,ink,true);txt(s,it[2],650,y-4,500,50,17,muted);});
 txt(s,"SimpleDesk собирает эти процессы в один ежедневный ритм.",64,610,1080,40,24,dark,true);footer(s,2);
}
//3
{
 const s=p.slides.add();s.background.fill=dark;txt(s,"ПРОДУКТ",64,52,300,20,13,lime,true);txt(s,"Один контур: от первого обращения до управленческого решения",64,88,1080,92,38,white,true);
 const steps=[["КЛИЕНТ","контакт, история, сегмент"],["ЗАПИСЬ","время, сотрудник, ресурс"],["ОПЕРАЦИЯ","услуга, товар, задача"],["ДЕНЬГИ","оплата, расход, возврат"],["РЕШЕНИЕ","аналитика, отчёт, действие"]];
 steps.forEach((a,i)=>{const x=64+i*230;rect(s,x,264,190,190,i===4?lime:"#234B3A",18);txt(s,String(i+1).padStart(2,"0"),x+18,282,40,24,13,i===4?dark:"#AFC5B8",true);txt(s,a[0],x+18,336,154,30,20,i===4?dark:white,true);txt(s,a[1],x+18,382,154,52,15,i===4?dark:"#C7D7CF");if(i<4)txt(s,"→",x+196,330,28,36,26,lime,true,"center");});
 txt(s,"Каждое действие обновляет общую картину — без повторного ввода и ручной сверки.",64,520,1100,52,21,white,true);footer(s,3,true);
}
//4
{
 const s=p.slides.add();s.background.fill=paper;title(s,"Возможности","Модули собраны вокруг реального рабочего дня", "Компания включает только нужные разделы и настраивает порядок навигации.");
 const groups=[["ПРОДАЖИ И КЛИЕНТЫ","Клиенты\nКалендарь и записи\nПродажи\nАкции",green],["ЛЮДИ И ОПЕРАЦИИ","Сотрудники\nГрафики\nЗадачи\nРесурсы",dark],["КОНТРОЛЬ БИЗНЕСА","Товары и расходники\nФинансы\nАналитика\nОтчёты", "#8C5E3C"]];
 groups.forEach((g,i)=>{const x=64+i*390;rect(s,x,258,350,316,white,16,line);rect(s,x,258,350,12,g[2],6);txt(s,g[0],x+24,294,300,26,14,g[2],true);txt(s,g[1],x+24,342,300,178,23,ink,true);});footer(s,4);
}
//5
{
 const s=p.slides.add();s.background.fill=white;title(s,"Рабочий сценарий","SimpleDesk помогает команде вести день, а не обслуживать систему","");
 const flow=[["Утро","Открыть панель «Сегодня»\nПроверить записи и задачи"],["В течение дня","Принять клиента\nПровести продажу\nСписать расходники"],["По ситуации","Перенести запись\nНазначить ответственного\nУвидеть дефицит"],["Вечером","Сверить кассу\nСохранить отчёт\nОпределить действия"]];
 flow.forEach((a,i)=>{const x=64+i*294;txt(s,String(i+1),x,244,38,38,18,white,true,"center");rect(s,x,244,38,38,green,19);txt(s,a[0],x,304,250,34,22,ink,true);txt(s,a[1],x,360,245,116,17,muted);if(i<3)rule(s,x+184,262,98,line);});
 rect(s,64,548,1110,62,lime,12);txt(s,"Результат: у каждого есть следующий шаг, у владельца — актуальная картина дня.",88,548,1060,62,21,dark,true);footer(s,5);
}
//6
{
 const s=p.slides.add();s.background.fill=paper;title(s,"Ценность","Что бизнес получает на практике","");
 const vals=[["Меньше потерь контекста","Карточка клиента связывает историю, визиты, продажи и задачи."],["Быстрее ежедневные решения","Записи, загрузка, остатки и деньги видны в одном месте."],["Понятнее ответственность","Роли, права, графики и ответственные закреплены в системе."],["Управление по фактам","Отчёты показывают, что произошло и где требуется действие."]];
 vals.forEach((v,i)=>{const x=64+(i%2)*568,y=238+Math.floor(i/2)*174;txt(s,`0${i+1}`,x,y,50,32,15,green,true);txt(s,v[0],x+64,y-2,450,36,23,ink,true);txt(s,v[1],x+64,y+48,450,58,17,muted);});footer(s,6);
}
//7
{
 const s=p.slides.add();s.background.fill=dark;txt(s,"ПРЕИМУЩЕСТВА",64,52,300,20,13,lime,true);txt(s,"Продукт адаптируется под бизнес — не наоборот",64,88,1000,60,38,white,true);
 const a=[["Модульность","Можно отключить лишние разделы и сохранить простой интерфейс."],["Шаблоны ниш","Салон, автосервис, кофейня, магазин или универсальный сценарий."],["Ролевой доступ","Владелец, администратор и сотрудник видят свою рабочую зону."],["Единая база","Данные компании разделены и защищены на уровне company_id и RLS."],["Светлая и тёмная темы","Комфортная работа в разных условиях и на разных ролях."],["Быстрый старт","Демо-режим и мастер настройки помогают увидеть ценность сразу."]];
 a.forEach((v,i)=>{const x=64+(i%3)*390,y=214+Math.floor(i/3)*190;rect(s,x,y,350,152,"#234B3A",14);txt(s,v[0],x+22,y+18,305,32,20,white,true);txt(s,v[1],x+22,y+62,305,66,15,"#C7D7CF");});footer(s,7,true);
}
//8
{
 const s=p.slides.add();s.background.fill=white;title(s,"Позиционирование","Кому SimpleDesk особенно полезен", "Командам, где есть клиенты, повторяющиеся операции и необходимость видеть день целиком.");
 const seg=[["Сервисные компании","салоны, студии, автосервисы, ремонт"],["Небольшая розница","магазины, шоурумы, точки с остатками"],["Кофейни и локальные проекты","смены, закупки, задачи и кассовая дисциплина"],["Универсальный малый бизнес","команды, которым CRM недостаточно, а ERP слишком тяжела"]];
 seg.forEach((v,i)=>{const y=250+i*86;txt(s,v[0],64,y,370,32,20,ink,true);txt(s,v[1],470,y,680,32,17,muted);rule(s,64,y+56,1086);});footer(s,8);
}
//9
{
 const s=p.slides.add();s.background.fill=paper;title(s,"Текущий этап","MVP уже закрывает базовый операционный цикл", "Презентация отделяет реализованное ядро от направлений, которые ещё требуют развития.");
 rect(s,64,250,535,292,white,16,line);txt(s,"УЖЕ В ПРОДУКТЕ",88,274,450,26,15,green,true);txt(s,"• клиенты, сотрудники и записи\n• графики, ресурсы и задачи\n• склад, продажи и финансы\n• акции, аналитика и отчёты\n• Supabase Auth, PostgreSQL и RLS",88,324,440,184,19,ink,true);
 rect(s,635,250,539,292,"#F0E2D3",16,"#F0E2D3");txt(s,"СЛЕДУЮЩИЙ УРОВЕНЬ",659,274,450,26,15,"#8C5E3C",true);txt(s,"• полноценные приглашения сотрудников\n• детальная матрица прав\n• автоматизации и напоминания\n• рабочие интеграции и платежи\n• импорт, API и вебхуки",659,324,450,184,19,ink,true);footer(s,9);
}
//10
{
 const s=p.slides.add();s.background.fill=dark;txt(s,"ИДЕИ ДЛЯ РАЗВИТИЯ",64,52,400,20,13,lime,true);txt(s,"Следующий рост — не больше экранов, а больше автоматических действий",64,88,1100,92,38,white,true);
 const ideas=[["Умный рабочий день","Автоприоритеты: кого подтвердить, что докупить, где есть окно."],["Возврат клиентов","Сегменты по давности визита и готовые сценарии повторного контакта."],["Контроль маржинальности","Прибыль по услуге, сотруднику, акции и категории товара."],["Telegram для команды","Задачи, напоминания и короткая сводка владельцу без входа в систему."]];
 ideas.forEach((v,i)=>{const x=64+(i%2)*568,y=246+Math.floor(i/2)*154;txt(s,`0${i+1}`,x,y,44,28,14,lime,true);txt(s,v[0],x+58,y-2,450,32,21,white,true);txt(s,v[1],x+58,y+40,450,62,16,"#C7D7CF");});
 txt(s,"Рекомендуемый пилот: 1 ниша · 3–5 компаний · 4 недели наблюдения за рабочими сценариями",64,590,1110,42,19,lime,true);footer(s,10,true);
}
//11
{
 const s=p.slides.add();s.background.fill=paper;await img(s,ICON,64,54,70,70);txt(s,"SimpleDesk",158,54,300,70,34,ink,true);txt(s,"Сделать ежедневную работу\nпонятной, связной и управляемой",64,192,850,126,46,ink,true);txt(s,"Следующий шаг — показать продукт на реальном сценарии бизнеса\nи выбрать гипотезы для пилота.",66,354,790,70,21,muted);rect(s,900,156,280,330,dark,20);txt(s,"ДЕМО-ФОКУС",928,184,220,24,13,lime,true);txt(s,"1. Настроить компанию\n2. Создать запись\n3. Провести продажу\n4. Посмотреть отчёт",928,238,210,180,20,white,true);footer(s,11);
}

await fs.mkdir(PRE,{recursive:true});await fs.mkdir("C:/Users/juzzo/OneDrive/Документы/onboarding/outputs",{recursive:true});
for (const [i,s] of p.slides.items.entries()){const b=await p.export({slide:s,format:"png",scale:1});await fs.writeFile(`${PRE}/slide-${String(i+1).padStart(2,"0")}.png`,new Uint8Array(await b.arrayBuffer()));const l=await s.export({format:"layout"});await fs.writeFile(`${PRE}/slide-${String(i+1).padStart(2,"0")}.layout.json`,await l.text());}
const m=await p.export({format:"webp",montage:true,scale:1});await fs.writeFile(`${PRE}/montage.webp`,new Uint8Array(await m.arrayBuffer()));
const pptx=await PresentationFile.exportPptx(p);await pptx.save(OUT);
