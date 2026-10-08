"""Pruebas de la máquina de estados del tutor Socrático de primaria."""

from app.domain.enums import TutorStep
from app.services.ai.prompts import (
    GRADE_PROFILES,
    STEP_INSTRUCTIONS,
    STEP_ORDER,
    STEP_QUESTION_TYPES,
    brevity_reminder,
    build_step_instruction,
    build_system_prompt,
    confidence_steps,
    default_path_for,
    detect_fatigue,
    final_answer_step,
    looks_like_number_problem,
    min_answers,
    next_step,
    path_steps,
)


def test_flow_has_9_critical_thinking_steps() -> None:
    assert len(STEP_ORDER) == 9
    assert STEP_ORDER[0] == TutorStep.CURIOSITY
    assert STEP_ORDER[-1] == TutorStep.TRANSFER


def test_answer_is_never_given_before_conclusion() -> None:
    conclusion = STEP_ORDER.index(TutorStep.CONCLUSION)
    assert STEP_ORDER.index(TutorStep.HYPOTHESIS) < STEP_ORDER.index(TutorStep.REASONING)
    assert STEP_ORDER.index(TutorStep.PERSPECTIVES) < conclusion
    assert STEP_ORDER.index(TutorStep.METACOGNITION) > conclusion


def test_every_step_has_instruction() -> None:
    for step in TutorStep:
        assert step in STEP_INSTRUCTIONS
        assert STEP_INSTRUCTIONS[step]


def test_next_step_advances_and_saturates() -> None:
    assert next_step(TutorStep.CURIOSITY) == TutorStep.UNDERSTAND
    assert next_step(TutorStep.TRANSFER) == TutorStep.TRANSFER


def test_reasoning_needs_more_than_one_answer() -> None:
    assert min_answers(TutorStep.REASONING) == 2
    assert min_answers(TutorStep.CURIOSITY) == 1


def test_hint_level_injected() -> None:
    assert "NO LO SÉ TODAVÍA" in build_step_instruction(TutorStep.REASONING, hint_level=1)
    assert "PISTA" in build_step_instruction(TutorStep.REASONING, hint_level=2)


def test_system_prompt_adapts_to_grade() -> None:
    assert set(GRADE_PROFILES) == {1, 2, 3, 4, 5, 6}
    assert GRADE_PROFILES[1] in build_system_prompt(1)
    assert "no sabes el grado" in build_system_prompt(None)


def test_quick_path_is_short_and_keeps_core_thinking() -> None:
    quick = path_steps("quick")
    assert len(quick) == 6
    # Ni el camino corto se salta entender los datos: es lo que evita pedir "la respuesta".
    assert quick[0] == TutorStep.UNDERSTAND
    assert TutorStep.CONCLUSION in quick and TutorStep.METACOGNITION in quick
    assert next_step(TutorStep.REASONING, "quick") == TutorStep.CONCLUSION
    assert min_answers(TutorStep.REASONING, "quick") == 1


def test_youngest_start_on_quick_path() -> None:
    assert default_path_for(1) == "quick"
    assert default_path_for(2) == "quick"
    assert default_path_for(3) == "full"
    assert default_path_for(None) == "full"


def test_detects_question_fatigue() -> None:
    for text in ["me hace muchas preguntas", "Qué aburrido", "ya me cansé", "YA NO QUIERO", "mejor lo dejo"]:
        assert detect_fatigue(text), text
    for text in ["Les doy 4 a cada uno", "no sé todavía", "", None]:
        assert not detect_fatigue(text), text


def test_answer_is_confirmed_after_the_child_concludes() -> None:
    # El mensaje de Conclusión se genera ANTES de que el niño concluya: no debe revelar.
    assert "NO reveles" in STEP_INSTRUCTIONS[TutorStep.CONCLUSION]
    # El siguiente (¿Cómo pensé?) llega con la conclusión ya dada: ahí se confirma o corrige.
    assert "respuesta correcta" in STEP_INSTRUCTIONS[TutorStep.METACOGNITION]


def test_problem_path_plans_before_calculating_and_checks_after() -> None:
    problem = path_steps("problem")
    assert problem[0] == TutorStep.UNDERSTAND
    order = [TutorStep.ESTIMATE, TutorStep.PLAN, TutorStep.SOLVE, TutorStep.CHECK]
    assert [problem.index(s) for s in order] == sorted(problem.index(s) for s in order)
    assert problem.index(TutorStep.CHECK) < problem.index(TutorStep.METACOGNITION)
    assert "SIN hacer todavía las cuentas" in STEP_INSTRUCTIONS[TutorStep.PLAN]
    assert "NO digas si es correcto" in STEP_INSTRUCTIONS[TutorStep.CHECK]


def test_number_problems_take_the_problem_path() -> None:
    assert looks_like_number_problem("Tengo 24 caramelos para 5 amigos")
    assert not looks_like_number_problem("¿Por qué el cielo es azul?")
    assert not looks_like_number_problem("¿Qué pesa más: 1 kilo de algodón o de piedras?")
    assert default_path_for(1, "Ana tiene 12 canicas y regala 5") == "problem"
    assert default_path_for(1, "¿Los peces duermen?") == "quick"


def test_fatigue_shortcut_and_confidence_fit_each_path() -> None:
    assert final_answer_step("full") == TutorStep.CONCLUSION
    assert final_answer_step("quick") == TutorStep.CONCLUSION
    assert final_answer_step("problem") == TutorStep.CHECK
    assert confidence_steps("problem") == (TutorStep.ESTIMATE, TutorStep.CHECK)
    assert confidence_steps("full") == (TutorStep.HYPOTHESIS, TutorStep.CONCLUSION)
    for path in ("full", "quick", "problem"):
        steps = path_steps(path)
        assert all(s in steps for s in confidence_steps(path)), path


def test_steps_declare_socratic_question_types() -> None:
    assert "CLARIFICACIÓN" in build_step_instruction(TutorStep.UNDERSTAND)
    assert "SUPUESTOS" in build_step_instruction(TutorStep.PLAN)
    assert "ALTERNATIVAS" in build_step_instruction(TutorStep.PERSPECTIVES)
    assert "CONSECUENCIAS" in build_step_instruction(TutorStep.CHECK)
    assert "compañero" in build_step_instruction(TutorStep.METACOGNITION)
    assert TutorStep.SOLVE not in STEP_QUESTION_TYPES  # calcular no es momento de preguntar


def test_brevity_and_supports_scale_with_grade() -> None:
    assert "2 frases" in brevity_reminder(1)
    assert "3 frases" in brevity_reminder(None) and "3 frases" in brevity_reminder(4)
    assert "4 frases" in brevity_reminder(6)
    assert "2 frases" in build_step_instruction(TutorStep.REASONING, grade=2)
    assert "emojis" in GRADE_PROFILES[1] and "emojis" not in GRADE_PROFILES[5]
    assert "compare dos formas" in GRADE_PROFILES[3]
    assert "compare dos formas" not in GRADE_PROFILES[2]
