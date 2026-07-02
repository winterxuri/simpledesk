import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PublicSite } from "@/components/layout/public-site";
import { PRODUCT_NAME } from "@/config/product";

const sections = [
  {
    title: "1. Предмет условий",
    text: `${PRODUCT_NAME} предоставляет пользователю доступ к веб-платформе для ведения клиентов, записей, сотрудников, товаров, задач, отчётов и связанных рабочих данных малого бизнеса.`
  },
  {
    title: "2. Регистрация",
    text: "Пользователь указывает достоверные данные, самостоятельно отвечает за сохранность логина и пароля, а также за действия, совершённые под его аккаунтом."
  },
  {
    title: "3. Данные пользователя",
    text: "Пользователь самостоятельно определяет, какие клиентские, финансовые и операционные данные он размещает в сервисе, и обязан иметь законные основания для их обработки."
  },
  {
    title: "4. Ограничения",
    text: "Запрещено использовать сервис для незаконной деятельности, загрузки вредоносных материалов, нарушения прав третьих лиц или попыток обхода технических ограничений."
  },
  {
    title: "5. Доступность сервиса",
    text: "Сервис развивается в режиме MVP. Возможны изменения интерфейса, модулей и логики работы. Критичные данные рекомендуется регулярно экспортировать."
  },
  {
    title: "6. Ответственность",
    text: "Сервис не является бухгалтерской, налоговой или юридической системой. Пользователь самостоятельно проверяет корректность отчётов и принимает управленческие решения."
  },
  {
    title: "7. Изменение условий",
    text: "Условия могут обновляться по мере развития продукта. Продолжение использования сервиса после публикации новой версии означает принятие обновлённых условий."
  }
];

export default function TermsPage() {
  return (
    <PublicSite>
      <LegalPage
        title="Условия использования"
        description="Правила доступа к SimpleDesk и базовые обязанности пользователя."
        sections={sections}
      />
    </PublicSite>
  );
}

function LegalPage({
  title,
  description,
  sections
}: {
  title: string;
  description: string;
  sections: { title: string; text: string }[];
}) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Юридическое</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-normal md:text-5xl">{title}</h1>
      <p className="mt-4 text-muted-foreground">{description}</p>
      <Card className="mt-8 p-6">
        <p className="text-sm text-muted-foreground">
          Шаблон для MVP. Перед коммерческим запуском добавьте реквизиты владельца сервиса,
          контакты поддержки и проверьте документ с профильным специалистом.
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
        Связанные документы:{" "}
        <Link className="text-primary" href="/legal/privacy">политика конфиденциальности</Link>
        {" "}и{" "}
        <Link className="text-primary" href="/legal/personal-data">согласие на обработку данных</Link>.
      </div>
    </section>
  );
}
