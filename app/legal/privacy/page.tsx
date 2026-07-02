import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PublicSite } from "@/components/layout/public-site";
import { PRODUCT_NAME } from "@/config/product";

const sections = [
  {
    title: "1. Какие данные обрабатываются",
    text: "Имя, email, пароль в защищённом виде у провайдера авторизации, название компании, настройки рабочего пространства, а также данные, которые пользователь самостоятельно добавляет в сервис."
  },
  {
    title: "2. Для чего используются данные",
    text: "Для регистрации, входа, отображения рабочего кабинета, сохранения бизнес-данных, формирования отчётов, поддержки пользователя и улучшения продукта."
  },
  {
    title: "3. Где хранятся данные",
    text: "На этапе MVP данные хранятся в подключённой инфраструктуре Supabase и Vercel. Точный перечень провайдеров нужно зафиксировать перед коммерческим запуском."
  },
  {
    title: "4. Доступ к данным",
    text: "Доступ к данным компании получают пользователи, добавленные в рабочее пространство с соответствующей ролью. Владелец отвечает за выдачу и отзыв доступов сотрудников."
  },
  {
    title: "5. Экспорт и удаление",
    text: "Пользователь может экспортировать отчёты и часть рабочих данных из интерфейса. Для полного удаления аккаунта и данных нужен отдельный запрос владельцу сервиса или будущая функция удаления аккаунта."
  },
  {
    title: "6. Безопасность",
    text: "Сервис использует авторизацию Supabase и разграничение доступа на уровне компании. Пользователь обязан хранить пароль в тайне и не передавать доступ посторонним."
  },
  {
    title: "7. Обновление политики",
    text: "Политика может меняться при добавлении новых функций, интеграций и провайдеров обработки данных."
  }
];

export default function PrivacyPage() {
  return (
    <PublicSite>
      <section className="mx-auto max-w-4xl px-4 py-16">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Юридическое</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal md:text-5xl">Политика конфиденциальности</h1>
        <p className="mt-4 text-muted-foreground">
          Как {PRODUCT_NAME} обрабатывает данные пользователя и его компании.
        </p>
        <Card className="mt-8 p-6">
          <p className="text-sm text-muted-foreground">
            Это MVP-шаблон. Перед публичным запуском укажите владельца сервиса,
            юридический адрес, email для обращений и провайдеров хранения данных.
          </p>
        </Card>
        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="mt-2 leading-7 text-muted-foreground">{section.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-sm text-muted-foreground">
          Также смотрите{" "}
          <Link className="text-primary" href="/legal/terms">условия использования</Link>
          {" "}и{" "}
          <Link className="text-primary" href="/legal/personal-data">согласие на обработку персональных данных</Link>.
        </div>
      </section>
    </PublicSite>
  );
}
