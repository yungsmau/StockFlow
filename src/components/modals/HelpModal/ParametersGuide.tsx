export default function ParametersGuide() {
  return (
    <>
      <h3 className="help-modal__heading">Параметры моделирования</h3>
      <div className="help-modal__parameters">
        <div className="help-modal__param">
          <span className="help-modal__param-title">Поставка, ед.</span>
          <p className="help-modal__param-discription">Объем товара, который приходит на склад при оформлении заказа. Влияет на частоту поставок и средний остаток.</p>
        </div>
        <div className="help-modal__param">
          <span className="help-modal__param-title">Порог, ед.</span>
          <p className="help-modal__param-discription">Уровень остатка, при котором автоматически оформляется новая поставка. Должен покрывать расход за период доставки.</p>
        </div>
        <div className="help-modal__param">
          <span className="help-modal__param-title">Срок поставки, дни</span>
          <p className="help-modal__param-discription">Количество дней между оформлением заказа и приходом товара на склад. Используется для расчёта рекомендуемого порога.</p>
        </div>
        <div className="help-modal__param">
          <span className="help-modal__param-title">Цена, руб./ед</span>
          <p className="help-modal__param-discription">Себестоимость одной единицы товара. Используется для расчёта стоимости запасов и эффективности модели.</p>
        </div>
        <div className="help-modal__param">
          <span className="help-modal__param-title">Максимальный расход, ед.</span>
          <p className="help-modal__param-discription">Автоматически рассчитанное значение, обеспечивающее покрытие максимального расхода за указанный период доставки.</p>
        </div>
        <div className="help-modal__param">
          <span className="help-modal__param-title">Средний расход</span>
          <p className="help-modal__param-discription">Автоматически рассчитанное значение среднего расхода за указанный период доставки.</p>
        </div>
        <div className="help-modal__param">
          <span className="help-modal__param-title">Минимальный объем закупа, ед.</span>
          <p className="help-modal__param-discription">
            Дополнительное значение. Минимальный объем закупа для конкретного товара.
          </p>
        </div>
        <div className="help-modal__param">
          <span className="help-modal__param-title">Оптимальный объем закупа, ед.</span>
          <p className="help-modal__param-discription">
            Дополнительное значение. Оптимальный объем закупа для конкретного товара.
          </p>
        </div>
      </div>
    </>
  );
}